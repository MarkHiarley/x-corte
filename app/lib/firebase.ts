
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyBYKvlk8ioYDecLYg-yupH1Oyy5U_ury9s",
  authDomain: "xcortes-e6f64.firebaseapp.com",
  projectId: "xcortes-e6f64",
  storageBucket: "xcortes-e6f64.firebasestorage.app",
  messagingSenderId: "1016197568464",
  appId: "1:1016197568464:web:f6ee67ab1ffbdb333d4bd5",
  measurementId: "G-KMS1SVW06E"
}
const app = initializeApp(firebaseConfig);


export const db = getFirestore(app);

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
