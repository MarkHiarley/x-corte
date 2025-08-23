
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Verificar se todas as variáveis necessárias estão definidas
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase configuration is missing required environment variables');
  throw new Error('Firebase configuration is incomplete');
}

const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Configurações para desenvolvimento (opcional)
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase initialized in development mode');
}

// Analytics (apenas no cliente)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
