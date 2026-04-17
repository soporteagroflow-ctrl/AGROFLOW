import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBOOE6r-qM-d9fsxKdOb17u31YcvW2y37c',
  authDomain: 'agroflow-211c0.firebaseapp.com',
  projectId: 'agroflow-211c0',
  storageBucket: 'agroflow-211c0.firebasestorage.app',
  messagingSenderId: '484295311094',
  appId: '1:484295311094:web:587f97c6d6e4ce191db6d7',
  measurementId: 'G-6LKGP1BC9P',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
