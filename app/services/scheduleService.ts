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

    // Criar um novo schedule para uma empresa
    async createSchedule(
        enterpriseEmail: string, 
        scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>
    ) {
        try {
            if (!enterpriseEmail) {
                throw new Error('Email da empresa é obrigatório para criar um schedule');
            }

            // Verificar se a empresa existe
            const enterpriseCheck = await this.checkEnterpriseExists(enterpriseEmail);
            if (!enterpriseCheck.success) {
                return enterpriseCheck;
            }

            // Caminho para a subcoleção de schedules da empresa
            const schedulesCollectionPath = `enterprises/${enterpriseEmail}/schedules`;
            
            // Se o novo schedule for padrão, remover isDefault dos outros
            if (scheduleData.isDefault) {
                await this.removeDefaultFromOthers(enterpriseEmail);
            }
            
            const docRef = await addDoc(collection(db, schedulesCollectionPath), {
                ...scheduleData,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });

            return {
                success: true,
                id: docRef.id,
                data: { id: docRef.id, ...scheduleData }
            };
        } catch (error) {
            console.error('Erro ao criar schedule:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    },

    // Buscar todos os schedules de uma empresa
    async getAllSchedules(enterpriseEmail: string) {
        try {
            if (!enterpriseEmail) {
                throw new Error('Email da empresa é obrigatório');
            }

            // Verificar se a empresa existe
            const enterpriseCheck = await this.checkEnterpriseExists(enterpriseEmail);
            if (!enterpriseCheck.success) {
                return enterpriseCheck;
            }

            const schedulesCollectionPath = `enterprises/${enterpriseEmail}/schedules`;
            const q = query(
                collection(db, schedulesCollectionPath),
                orderBy('createdAt', 'desc')
            );

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
    }
};
