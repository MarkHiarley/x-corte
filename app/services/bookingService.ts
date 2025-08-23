import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { Booking, TimeSlot, AvailableSlot } from '../types';
import { scheduleService } from './scheduleService';
import { productService } from './productService';

export const bookingService = {
    // Utilitários de tempo
    timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    },

    minutesToTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    },

    addMinutesToTime(time: string, minutesToAdd: number): string {
        const totalMinutes = this.timeToMinutes(time) + minutesToAdd;
        return this.minutesToTime(totalMinutes);
    },

    // Verificar se a empresa existe
    async checkEnterpriseExists(email: string) {
        try {
            const enterpriseRef = doc(db, 'enterprises', email);
            const enterpriseSnap = await getDoc(enterpriseRef);
            
            if (enterpriseSnap.exists()) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: `Empresa com email '${email}' não encontrada`
                };
            }
        } catch (error) {
            console.error('Erro ao verificar empresa:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    // Buscar agendamentos de uma data específica
    async getBookingsByDate(enterpriseEmail: string, date: string) {
        try {
            const bookingsCollectionPath = `enterprises/${enterpriseEmail}/bookings`;

            // Query simples por data para evitar necessidade de índices compostos
            const bookingsQuery = query(
                collection(db, bookingsCollectionPath),
                where('date', '==', date)
            );

            const snapshot = await getDocs(bookingsQuery);
            
            // Filtrar status e ordenar localmente
            const bookings = snapshot.docs
                .map(d => ({ id: d.id, ...(d.data() as any) }))
                .filter((b: any) => ['confirmed', 'pending'].includes(b.status))
                .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

            return {
                success: true,
                data: bookings as Booking[]
            };

        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    // Verificar se um horário está disponível
    async isTimeSlotAvailable(
        enterpriseEmail: string,
        date: string,
        startTime: string,
        duration: number
    ): Promise<{ available: boolean; conflictingBooking?: Booking }> {
        try {
            const endTime = this.addMinutesToTime(startTime, duration);
            const bookingsResult = await this.getBookingsByDate(enterpriseEmail, date);
            
            if (!bookingsResult.success) {
                return { available: false };
            }

            const bookings = bookingsResult.data || [];
            
            // Converter horários para minutos para facilitar comparação
            const newStartMinutes = this.timeToMinutes(startTime);
            const newEndMinutes = this.timeToMinutes(endTime);

            for (const booking of bookings) {
                const bookingStartMinutes = this.timeToMinutes(booking.startTime);
                const bookingEndMinutes = this.timeToMinutes(booking.endTime);

                // Verificar sobreposição
                if (
                    (newStartMinutes >= bookingStartMinutes && newStartMinutes < bookingEndMinutes) ||
                    (newEndMinutes > bookingStartMinutes && newEndMinutes <= bookingEndMinutes) ||
                    (newStartMinutes <= bookingStartMinutes && newEndMinutes >= bookingEndMinutes)
                ) {
                    return { 
                        available: false, 
                        conflictingBooking: booking 
                    };
                }
            }

            return { available: true };

        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            return { available: false };
        }
    },

    // Gerar slots disponíveis para uma data
    async getAvailableSlots(
        enterpriseEmail: string,
        date: string,
        duration: number
    ): Promise<{ success: boolean; data?: AvailableSlot[]; error?: string }> {
        try {
            // Primeiro tente buscar o schedule padrão diretamente
            let defaultScheduleResult = await scheduleService.getDefaultSchedule(enterpriseEmail);
            let defaultSchedule: any = null;

            if (defaultScheduleResult.success && 'data' in defaultScheduleResult) {
                defaultSchedule = defaultScheduleResult.data;
            } else {
                // Fallback: buscar todos e encontrar o isDefault (compatibilidade)
                const schedulesResult = await scheduleService.getAllSchedules(enterpriseEmail);
                if (!schedulesResult.success) {
                    return {
                        success: false,
                        error: 'error' in schedulesResult ? schedulesResult.error : 'Erro ao buscar schedules'
                    };
                }

                const schedules = 'data' in schedulesResult ? schedulesResult.data : [];
                defaultSchedule = schedules.find((s: any) => s.isDefault) || null;
            }

            if (!defaultSchedule) {
                return {
                    success: false,
                    error: 'Nenhum horário padrão configurado para esta empresa'
                };
            }

            // Determinar o dia da semana (assumindo formato YYYY-MM-DD)
            const dateObj = new Date(date + 'T00:00:00');
            const dayIndex = dateObj.getDay(); // 0=Sunday ... 6=Saturday

            // Normalizações de nomes de dias para compatibilidade (English / Português)
            const dayNamesEN = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
            const dayNamesPT = ['domingo','segunda','terca','terça','quarta','quinta','sexta','sabado','sábado'];
            const dayNameEN = dayNamesEN[dayIndex];

            // Encontrar a disponibilidade para este dia com comparação tolerante
            const availabilityArray = Array.isArray(defaultSchedule.availability) ? defaultSchedule.availability : [];

            const dayAvailability = availabilityArray.find((avail: any) => {
                if (!avail || !Array.isArray(avail.days)) return false;

                // Normalizar os dias configurados
                const normalizedDays = avail.days.map((d: any) => {
                    if (typeof d === 'number') return String(d);
                    if (typeof d === 'string') return d.toLowerCase().trim();
                    return String(d);
                });

                // Possíveis matches:
                // - contém o índice do dia (0..6) como string
                // - contém o nome em inglês (monday)
                // - contém o nome em português (segunda, terça, etc.)
                if (normalizedDays.includes(String(dayIndex))) return true;
                if (normalizedDays.includes(dayNameEN)) return true;

                // Checar PT: verificar se alguma entrada começa com as 3 primeiras letras de PT (ex: 'seg' ou 'segunda')
                const dayPtShort = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'][dayIndex];
                if (normalizedDays.some((d: string) => d.startsWith(dayPtShort.slice(0,3)))) return true;

                // Checar se qualquer entrada em PT corresponde exatamente
                if (normalizedDays.some((d: string) => dayNamesPT.includes(d))) return normalizedDays.some((d: string) => dayNamesPT.indexOf(d) === dayIndex);

                return false;
            });

            if (!dayAvailability) {
                return {
                    success: true,
                    data: [] // Nenhuma disponibilidade para este dia
                };
            }

            // Validar horário de início/fim
            if (!dayAvailability.startTime || !dayAvailability.endTime) {
                return {
                    success: true,
                    data: []
                };
            }

            const startMinutes = this.timeToMinutes(dayAvailability.startTime);
            const endMinutes = this.timeToMinutes(dayAvailability.endTime);

            if (isNaN(startMinutes) || isNaN(endMinutes) || endMinutes <= startMinutes) {
                return {
                    success: true,
                    data: []
                };
            }

            // Intervalo de 15 minutos entre slots (pode ser parametrizado no futuro)
            const slotInterval = 15;
            const slots: AvailableSlot[] = [];

            for (let minutes = startMinutes; minutes <= endMinutes - duration; minutes += slotInterval) {
                const slotStartTime = this.minutesToTime(minutes);
                const slotEndTime = this.addMinutesToTime(slotStartTime, duration);

                // Verificar se o slot está disponível
                const availability = await this.isTimeSlotAvailable(
                    enterpriseEmail,
                    date,
                    slotStartTime,
                    duration
                );

                if (availability.available) {
                    slots.push({
                        startTime: slotStartTime,
                        endTime: slotEndTime,
                        duration
                    });
                }
            }

            return {
                success: true,
                data: slots
            };

        } catch (error) {
            console.error('Erro ao gerar slots disponíveis:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    // Criar agendamento
    async createBooking(
        enterpriseEmail: string,
        bookingData: Omit<Booking, 'id' | 'enterpriseEmail' | 'endTime' | 'createdAt' | 'updatedAt'>
    ) {
        try {
            // Verificar se a empresa existe
            const enterpriseCheck = await this.checkEnterpriseExists(enterpriseEmail);
            if (!enterpriseCheck.success) {
                return enterpriseCheck;
            }

            // Buscar dados do produto
            const productResult = await productService.getProductById(enterpriseEmail, bookingData.productId);
            if (!productResult.success) {
                return {
                    success: false,
                    error: 'Produto não encontrado'
                };
            }

            if (!('data' in productResult)) {
                return {
                    success: false,
                    error: 'Dados do produto não encontrados'
                };
            }

            const product = productResult.data as any;
            const endTime = this.addMinutesToTime(bookingData.startTime, product.duration);

            // Verificar disponibilidade
            const availability = await this.isTimeSlotAvailable(
                enterpriseEmail,
                bookingData.date,
                bookingData.startTime,
                product.duration
            );

            if (!availability.available) {
                return {
                    success: false,
                    error: `Horário não disponível. ${availability.conflictingBooking ? 
                        `Conflito com agendamento às ${availability.conflictingBooking.startTime}` : ''}`
                };
            }

            // Criar o agendamento
            const bookingsCollectionPath = `enterprises/${enterpriseEmail}/bookings`;
            const docRef = await addDoc(collection(db, bookingsCollectionPath), {
                ...bookingData,
                enterpriseEmail,
                productName: product.name,
                productDuration: product.duration,
                productPrice: product.price,
                endTime,
                status: 'pending',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });

            return {
                success: true,
                id: docRef.id,
                data: {
                    id: docRef.id,
                    ...bookingData,
                    enterpriseEmail,
                    productName: product.name,
                    productDuration: product.duration,
                    productPrice: product.price,
                    endTime,
                    status: 'pending'
                }
            };

        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    // Confirmar agendamento
    async confirmBooking(enterpriseEmail: string, bookingId: string) {
        try {
            const bookingRef = doc(db, `enterprises/${enterpriseEmail}/bookings`, bookingId);
            
            await updateDoc(bookingRef, {
                status: 'confirmed',
                updatedAt: Timestamp.now()
            });

            return {
                success: true,
                message: 'Agendamento confirmado com sucesso'
            };

        } catch (error) {
            console.error('Erro ao confirmar agendamento:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    // Listar agendamentos de uma empresa
    async getBookings(
        enterpriseEmail: string,
        date?: string,
        status?: string
    ) {
        try {
            const enterpriseCheck = await this.checkEnterpriseExists(enterpriseEmail);
            if (!enterpriseCheck.success) {
                return enterpriseCheck;
            }

            const bookingsCollectionPath = `enterprises/${enterpriseEmail}/bookings`;
            let bookingsQuery = query(collection(db, bookingsCollectionPath));

            // Adicionar filtros se fornecidos
            if (date) {
                bookingsQuery = query(bookingsQuery, where('date', '==', date));
            }
            if (status) {
                bookingsQuery = query(bookingsQuery, where('status', '==', status));
            }

            bookingsQuery = query(bookingsQuery, orderBy('date'), orderBy('startTime'));

            const snapshot = await getDocs(bookingsQuery);
            const bookings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                success: true,
                data: bookings
            };

        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
};
