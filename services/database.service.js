import { db } from '../firebaseConfig';
import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  onValue,
  off,
  serverTimestamp
} from 'firebase/database';

/**
 * Database Service
 * Handles all Realtime Database operations
 */

// Helper function to generate timestamp
export const getServerTimestamp = () => Date.now();

// Generic CRUD operations
export const createRecord = async (path, data) => {
  try {
    const newRef = push(ref(db, path));
    await set(newRef, {
      ...data,
      id: newRef.key,
      createdAt: getServerTimestamp()
    });
    return { success: true, id: newRef.key };
  } catch (error) {
    console.error('Error creating record:', error);
    return { success: false, error: error.message };
  }
};

export const getRecord = async (path) => {
  try {
    const snapshot = await get(ref(db, path));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: false, data: null };
  } catch (error) {
    console.error('Error getting record:', error);
    return { success: false, error: error.message };
  }
};

export const updateRecord = async (path, data) => {
  try {
    await update(ref(db, path), {
      ...data,
      updatedAt: getServerTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating record:', error);
    return { success: false, error: error.message };
  }
};

export const deleteRecord = async (path) => {
  try {
    await remove(ref(db, path));
    return { success: true };
  } catch (error) {
    console.error('Error deleting record:', error);
    return { success: false, error: error.message };
  }
};

export const setRecord = async (path, data) => {
  try {
    await set(ref(db, path), {
      ...data,
      updatedAt: getServerTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error setting record:', error);
    return { success: false, error: error.message };
  }
};

// Query operations
export const queryRecords = async (path, field, value) => {
  try {
    const dbRef = ref(db, path);
    const q = query(dbRef, orderByChild(field), equalTo(value));
    const snapshot = await get(q);

    if (snapshot.exists()) {
      const results = [];
      snapshot.forEach((childSnapshot) => {
        results.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return { success: true, data: results };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error querying records:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const getAllRecords = async (path) => {
  try {
    const snapshot = await get(ref(db, path));
    if (snapshot.exists()) {
      const results = [];
      snapshot.forEach((childSnapshot) => {
        results.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return { success: true, data: results };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting all records:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Real-time listeners
export const subscribeToPath = (path, callback) => {
  const dbRef = ref(db, path);
  onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
  return () => off(dbRef);
};

export const subscribeToQuery = (path, field, value, callback) => {
  const dbRef = ref(db, path);
  const q = query(dbRef, orderByChild(field), equalTo(value));

  onValue(q, (snapshot) => {
    if (snapshot.exists()) {
      const results = [];
      snapshot.forEach((childSnapshot) => {
        results.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      callback(results);
    } else {
      callback([]);
    }
  });

  return () => off(q);
};
