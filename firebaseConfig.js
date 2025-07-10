import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhYr4El0vS_xk9nuna8z_pOnOD7-TPdys",
  authDomain: "aplikasiaac.firebaseapp.com",
  projectId: "aplikasiaac",
  storageBucket: "aplikasiaac.firebasestorage.app",
  messagingSenderId: "718616564876",
  appId: "1:718616564876:web:60791cb3083a0fbe4057a9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

export default app;