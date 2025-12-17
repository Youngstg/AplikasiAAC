import { queryRecords, setRecord, createRecord } from './database.service';

/**
 * Child Service
 * Handles child-specific operations
 */

// Get custom buttons for a child
export const getCustomButtons = async (childEmail) => {
  try {
    const result = await queryRecords('parent-buttons', 'childEmail', childEmail);
    return result;
  } catch (error) {
    console.error('Error getting custom buttons:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Update child status (battery, etc.)
export const updateChildStatus = async (childId, statusData) => {
  try {
    const result = await setRecord(`child-status/${childId}`, statusData);
    return result;
  } catch (error) {
    console.error('Error updating child status:', error);
    return { success: false, error: error.message };
  }
};

// Get favorites for a child
export const getFavorites = async (childEmail) => {
  try {
    const result = await queryRecords('favorites', 'childEmail', childEmail);
    return result;
  } catch (error) {
    console.error('Error getting favorites:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Add favorite
export const addFavorite = async (childEmail, message) => {
  try {
    const result = await createRecord('favorites', {
      childEmail,
      message
    });
    return result;
  } catch (error) {
    console.error('Error adding favorite:', error);
    return { success: false, error: error.message };
  }
};
