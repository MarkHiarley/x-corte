import { db } from "../lib/firebase";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    Timestamp
} from "firebase/firestore";
import { Product } from "../types";

export const productService = {
    sanitizeDocumentId(name: string): string {
        return name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9\-_]/g, "")
            .replace(/--+/g, "-")
            .replace(/^-|-$/g, "");
    },

    async checkEnterpriseExists(email: string) {
        try {
            const enterpriseRef = doc(db, "enterprises", email);
            const enterpriseSnap = await getDoc(enterpriseRef);
            
            if (enterpriseSnap.exists()) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: `Empresa com email "${email}" não encontrada`
                };
            }
        } catch (error) {
            console.error("Erro ao verificar empresa:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido"
            };
        }
    },

    async getProducts(enterpriseEmail: string) {
        try {
            const enterpriseCheck = await this.checkEnterpriseExists(enterpriseEmail);
            if (!enterpriseCheck.success) {
                return enterpriseCheck;
            }

            const productsCollectionPath = `enterprises/${enterpriseEmail}/products`;
            const snapshot = await getDocs(collection(db, productsCollectionPath));
            
            const products = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter((product: any) => product.isActive !== false)
                .sort((a: any, b: any) => a.name?.localeCompare(b.name) || 0);

            return {
                success: true,
                data: products
            };

        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido"
            };
        }
    },

    // Buscar produto por ID
    async getProductById(enterpriseEmail: string, productId: string) {
        try {
            const enterpriseCheck = await this.checkEnterpriseExists(enterpriseEmail);
            if (!enterpriseCheck.success) {
                return enterpriseCheck;
            }

            const productRef = doc(db, `enterprises/${enterpriseEmail}/products`, productId);
            const productSnap = await getDoc(productRef);

            if (!productSnap.exists()) {
                return {
                    success: false,
                    error: 'Produto não encontrado'
                };
            }

            return {
                success: true,
                data: { id: productSnap.id, ...productSnap.data() }
            };

        } catch (error) {
            console.error("Erro ao buscar produto:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido"
            };
        }
    },

    // Criar produto
    async createProduct(
        enterpriseEmail: string,
        productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
    ) {
        try {
            const enterpriseCheck = await this.checkEnterpriseExists(enterpriseEmail);
            if (!enterpriseCheck.success) {
                return enterpriseCheck;
            }

            const productsCollectionPath = `enterprises/${enterpriseEmail}/products`;
            const documentId = this.sanitizeDocumentId(productData.name);

            // Verificar se já existe um produto com esse nome
            const existingProduct = await getDoc(doc(db, productsCollectionPath, documentId));
            if (existingProduct.exists()) {
                return {
                    success: false,
                    error: `Já existe um produto com o nome '${productData.name}'`
                };
            }

            // Criar o produto
            await setDoc(doc(db, productsCollectionPath, documentId), {
                ...productData,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });

            return {
                success: true,
                id: documentId,
                data: { id: documentId, ...productData }
            };

        } catch (error) {
            console.error("Erro ao criar produto:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido"
            };
        }
    },

    // Atualizar produto
    async updateProduct(
        enterpriseEmail: string,
        productId: string,
        updateData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
    ) {
        try {
            const enterpriseCheck = await this.checkEnterpriseExists(enterpriseEmail);
            if (!enterpriseCheck.success) {
                return enterpriseCheck;
            }

            const productRef = doc(db, `enterprises/${enterpriseEmail}/products`, productId);
            
            await updateDoc(productRef, {
                ...updateData,
                updatedAt: Timestamp.now()
            });

            return {
                success: true,
                message: 'Produto atualizado com sucesso'
            };

        } catch (error) {
            console.error("Erro ao atualizar produto:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido"
            };
        }
    },

    // Deletar produto (soft delete)
    async deleteProduct(enterpriseEmail: string, productId: string) {
        try {
            const enterpriseCheck = await this.checkEnterpriseExists(enterpriseEmail);
            if (!enterpriseCheck.success) {
                return enterpriseCheck;
            }

            const productRef = doc(db, `enterprises/${enterpriseEmail}/products`, productId);
            
            // Soft delete - apenas marca como inativo
            await updateDoc(productRef, {
                isActive: false,
                updatedAt: Timestamp.now()
            });

            return {
                success: true,
                message: 'Produto removido com sucesso'
            };

        } catch (error) {
            console.error("Erro ao remover produto:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido"
            };
        }
    }
};
