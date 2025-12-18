import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, db } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function
  const signup = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user data to Realtime Database
      const userRef = ref(db, `users/${user.uid}`);
      await set(userRef, {
        email: user.email,
        name: userData.name,
        role: userData.role,
        phoneNumber: userData.phoneNumber || null,
        createdAt: Date.now()
      });

      // Save to AsyncStorage for offline access
      await AsyncStorage.setItem('userRole', userData.role);

      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  // Sign in function
  const signin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  // Sign out function
  const logout = async () => {
    try {
      await signOut(auth);
      // Clear AsyncStorage on logout
      await AsyncStorage.removeItem('userRole');
    } catch (error) {
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  // Get user data from Realtime Database
  const getUserData = async (uid) => {
    try {
      const userRef = ref(db, `users/${uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // Try to get cached role from AsyncStorage first (for offline)
      const cachedRole = await AsyncStorage.getItem('userRole');
      if (cachedRole) {
        setUserRole(cachedRole);
      }
    };

    initAuth();

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Get user role from Realtime Database
        const userData = await getUserData(user.uid);
        if (userData?.role) {
          setUserRole(userData.role);
          // Cache role for offline access
          await AsyncStorage.setItem('userRole', userData.role);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        // Clear cache on logout
        await AsyncStorage.removeItem('userRole');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    signup,
    signin,
    logout,
    resetPassword,
    getUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};