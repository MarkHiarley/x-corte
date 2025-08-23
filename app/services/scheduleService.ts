import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    setDoc
} from 'firebase/firestore';

export interface Schedule {
    id?: string;
    name: string;
    timeZone: string;
    availability: {
        days: string[];
        startTime: string;
        endTime: string;
    }[];
    isDefault: boolean;
    createdAt?: any;
    updatedAt?: any;
}

export interface Enterprise {
    email: string;
    name: string;
    phone?: string;
    address?: string;
    createdAt?: any;
    updatedAt?: any;
}

export const scheduleService = {
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

    async createSchedule(
        enterpriseEmail: string, 
        scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>
    ) {
        try {
            if (!enterpriseEmail) {
                throw new Error('Email da empresa é obrigatório para criar um schedule');
            }

            const enterpriseCheck = await this.checkEnterpriseExists(enterpriseEmail);
            if (!enterpriseCheck.success) {
                return enterpriseCheck;
            }

            const schedulesCollectionPath = `enterprises/${enterpriseEmail}/schedules`;
            
            if (scheduleData.isDefault) {
                await this.removeDefaultFromOthers(enterpriseEmail);
            }
            
            const documentId = this.sanitizeDocumentId(scheduleData.name);

            const existingSchedule = await getDoc(doc(db, schedulesCollectionPath, documentId));
            if (existingSchedule.exists()) {
                return {
                    success: false,
                    error: `Já existe um schedule com o nome '${scheduleData.name}'`
                };
            }

            await setDoc(doc(db, schedulesCollectionPath, documentId), {
                ...scheduleData,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });

            console.log(`Schedule criado com ID personalizado: ${documentId}`);

            return {
                success: true,
                id: documentId,
                data: { id: documentId, ...scheduleData }
            };
        } catch (error) {
            console.error('Erro ao criar schedule:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    async getAllSchedules(enterpriseEmail: string) {
        try {
            if (!enterpriseEmail) {
                throw new Error('Email da empresa é obrigatório');
            }

            const schedulesCollectionPath = `enterprises/${enterpriseEmail}/schedules`;
            const q = query(collection(db, schedulesCollectionPath));

            const querySnapshot = await getDocs(q);
            const schedules: Schedule[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                schedules.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate()
                } as Schedule);
            });

            schedules.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });

            return {
                success: true,
                data: schedules
            };
        } catch (error) {
            console.error('Erro ao buscar schedules:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    // Buscar schedule por ID de uma empresa
    async getScheduleById(enterpriseEmail: string, scheduleId: string) {
        try {
            if (!enterpriseEmail || !scheduleId) {
                throw new Error('Email da empresa e ID do schedule são obrigatórios');
            }

            // Verificar se a empresa existe
            const enterpriseCheck = await this.checkEnterpriseExists(enterpriseEmail);
            if (!enterpriseCheck.success) {
                return enterpriseCheck;
            }

            const scheduleDocPath = `enterprises/${enterpriseEmail}/schedules/${scheduleId}`;
            const docRef = doc(db, scheduleDocPath);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    success: true,
                    data: {
                        id: docSnap.id,
                        ...data,
                        createdAt: data.createdAt?.toDate(),
                        updatedAt: data.updatedAt?.toDate()
                    } as Schedule
                };
            } else {
                return {
                    success: false,
                    error: 'Schedule não encontrado'
                };
            }
        } catch (error) {
            console.error('Erro ao buscar schedule:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    // Atualizar schedule de uma empresa
    async updateSchedule(
        enterpriseEmail: string, 
        scheduleId: string, 
        scheduleData: Partial<Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>>
    ) {
        try {
            if (!enterpriseEmail || !scheduleId) {
                throw new Error('Email da empresa e ID do schedule são obrigatórios');
            }

            // Se estiver sendo definido como padrão, remover isDefault dos outros
            if (scheduleData.isDefault === true) {
                await this.removeDefaultFromOthers(enterpriseEmail);
            }

            const scheduleDocPath = `enterprises/${enterpriseEmail}/schedules/${scheduleId}`;
            const docRef = doc(db, scheduleDocPath);
            
            await updateDoc(docRef, {
                ...scheduleData,
                updatedAt: Timestamp.now()
            });

            return {
                success: true,
                data: { id: scheduleId, ...scheduleData }
            };
        } catch (error) {
            console.error('Erro ao atualizar schedule:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    // Deletar schedule de uma empresa
    async deleteSchedule(enterpriseEmail: string, scheduleId: string) {
        try {
            if (!enterpriseEmail || !scheduleId) {
                throw new Error('Email da empresa e ID do schedule são obrigatórios');
            }

            const scheduleDocPath = `enterprises/${enterpriseEmail}/schedules/${scheduleId}`;
            const docRef = doc(db, scheduleDocPath);
            
            await deleteDoc(docRef);

            return {
                success: true,
                message: 'Schedule deletado com sucesso'
            };
        } catch (error) {
            console.error('Erro ao deletar schedule:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    // Buscar schedule padrão de uma empresa
    async getDefaultSchedule(enterpriseEmail: string) {
        try {
            if (!enterpriseEmail) {
                throw new Error('Email da empresa é obrigatório');
            }

            const schedulesCollectionPath = `enterprises/${enterpriseEmail}/schedules`;
            const q = query(
                collection(db, schedulesCollectionPath),
                where('isDefault', '==', true)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const data = doc.data();
                return {
                    success: true,
                    data: {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate(),
                        updatedAt: data.updatedAt?.toDate()
                    } as Schedule
                };
            } else {
                return {
                    success: false,
                    error: 'Nenhum schedule padrão encontrado'
                };
            }
        } catch (error) {
            console.error('Erro ao buscar schedule padrão:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    // Buscar dados da empresa
    async getEnterprise(email: string) {
        try {
            const enterpriseRef = doc(db, 'enterprises', email);
            const enterpriseSnap = await getDoc(enterpriseRef);
            
            if (enterpriseSnap.exists()) {
                const data = enterpriseSnap.data();
                return {
                    success: true,
                    data: {
                        ...data,
                        createdAt: data.createdAt?.toDate(),
                        updatedAt: data.updatedAt?.toDate()
                    } as Enterprise
                };
            } else {
                return {
                    success: false,
                    error: 'Empresa não encontrada'
                };
            }
        } catch (error) {
            console.error('Erro ao buscar empresa:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    // Remover isDefault de todos os outros schedules da empresa
    async removeDefaultFromOthers(enterpriseEmail: string) {
        try {
            const schedulesCollectionPath = `enterprises/${enterpriseEmail}/schedules`;
            const q = query(
                collection(db, schedulesCollectionPath),
                where('isDefault', '==', true)
            );

            const querySnapshot = await getDocs(q);
            
            // Atualizar todos os schedules que eram padrão para false
            const updatePromises = querySnapshot.docs.map(doc => 
                updateDoc(doc.ref, { 
                    isDefault: false, 
                    updatedAt: Timestamp.now() 
                })
            );

            await Promise.all(updatePromises);
            
            console.log(`Removido isDefault de ${updatePromises.length} schedules da empresa ${enterpriseEmail}`);
            
        } catch (error) {
            console.error('Erro ao remover isDefault dos outros schedules:', error);
        }
    },

    // Função para limpar o nome e transformar em ID válido para o Firebase
    sanitizeDocumentId(name: string): string {
        return name
            .toLowerCase()                    // Minúsculo
            .trim()                          // Remove espaços nas bordas
            .replace(/\s+/g, '-')           // Substitui espaços por hífen
            .replace(/[^a-z0-9\-_]/g, '')   // Remove caracteres especiais
            .replace(/--+/g, '-')           // Remove hífens duplos
            .replace(/^-|-$/g, '');         // Remove hífens no início/fim
    },
};
