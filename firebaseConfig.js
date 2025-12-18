import { initializeApp } from 'firebase/app';
import { getDatabase, enableLogging } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHDmuLbRiCmfkwJ28aqA8_aOnaXDhq97U",
  authDomain: "aplikasiaac-4bbab.firebaseapp.com",
  databaseURL: "https://aplikasiaac-4bbab-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aplikasiaac-4bbab",
  storageBucket: "aplikasiaac-4bbab.firebasestorage.app",
  messagingSenderId: "798044982093",
  appId: "1:798044982093:web:7d116a24fe0afb63bfc504",
  measurementId: "G-6DDR16JM7M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with best-available persistence
let auth;
try {
  // Prefer React Native persistence when available
  // Use require to avoid bundlers resolving the wrong platform build
  const authMod = require('firebase/auth');
  const init = authMod?.initializeAuth;
  const getRNP = authMod?.getReactNativePersistence;
  if (typeof init === 'function' && typeof getRNP === 'function') {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    auth = init(app, {
      persistence: getRNP(AsyncStorage),
    });
  }
} catch (e) {
  // ignore and fall back to default getAuth
}

if (!auth) {
  // Fallback: memory persistence (works everywhere)
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}

export { auth };

// Initialize Realtime Database with offline persistence
export const db = getDatabase(app);

// Enable offline persistence (automatic in Realtime Database)
// Data is automatically cached locally and synced when online
// Enable debug logging in development (optional)
if (__DEV__) {
  enableLogging(true);
}

export default app;
