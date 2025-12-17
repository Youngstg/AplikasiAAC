import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage Service
 * Handles local storage operations using AsyncStorage
 */

// Save data
export const saveData = async (key, value) => {
  try {
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return { success: true };
  } catch (error) {
    console.error('Error saving data:', error);
    return { success: false, error: error.message };
  }
};

// Get data
export const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      try {
        return { success: true, data: JSON.parse(value) };
      } catch {
        return { success: true, data: value };
      }
    }
    return { success: true, data: null };
  } catch (error) {
    console.error('Error getting data:', error);
    return { success: false, error: error.message, data: null };
  }
};

// Remove data
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    console.error('Error removing data:', error);
    return { success: false, error: error.message };
  }
};

// Clear all data
export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    return { success: true };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, error: error.message };
  }
};

// Save last message and audio
export const saveLastMessage = async (message, audioQueue = []) => {
  try {
    await AsyncStorage.setItem('lastMessage', message);
    if (audioQueue.length > 0) {
      await AsyncStorage.setItem('lastAudioQueue', JSON.stringify(audioQueue));
    }
    return { success: true };
  } catch (error) {
    console.error('Error saving last message:', error);
    return { success: false, error: error.message };
  }
};

// Get last message and audio
export const getLastMessage = async () => {
  try {
    const message = await AsyncStorage.getItem('lastMessage');
    const audioQueueStr = await AsyncStorage.getItem('lastAudioQueue');
    const audioQueue = audioQueueStr ? JSON.parse(audioQueueStr) : [];

    return {
      success: true,
      data: {
        message: message || '',
        audioQueue
      }
    };
  } catch (error) {
    console.error('Error getting last message:', error);
    return {
      success: false,
      error: error.message,
      data: { message: '', audioQueue: [] }
    };
  }
};
