import { queryRecords, createRecord, updateRecord, getAllRecords, deleteRecord } from './database.service';

/**
 * Parent Service
 * Handles parent-specific operations
 */

// Get parent-child connections
export const getParentChildConnections = async (parentEmail) => {
  try {
    const result = await queryRecords('parent-child-connections', 'parentEmail', parentEmail);
    return result;
  } catch (error) {
    console.error('Error getting parent-child connections:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Get child connections (from child side)
export const getChildConnections = async (childEmail) => {
  try {
    const result = await queryRecords('parent-child-connections', 'childEmail', childEmail);
    return result;
  } catch (error) {
    console.error('Error getting child connections:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Create parent-child connection
export const createConnection = async (connectionData) => {
  try {
    const result = await createRecord('parent-child-connections', connectionData);
    return result;
  } catch (error) {
    console.error('Error creating connection:', error);
    return { success: false, error: error.message };
  }
};

// Update connection status
export const updateConnectionStatus = async (connectionId, status) => {
  try {
    const result = await updateRecord(`parent-child-connections/${connectionId}`, { status });
    return result;
  } catch (error) {
    console.error('Error updating connection status:', error);
    return { success: false, error: error.message };
  }
};

// Get buttons created by parent
export const getParentButtons = async (parentEmail) => {
  try {
    const result = await queryRecords('parent-buttons', 'parentEmail', parentEmail);
    return result;
  } catch (error) {
    console.error('Error getting parent buttons:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Create button
export const createButton = async (buttonData) => {
  try {
    const result = await createRecord('parent-buttons', buttonData);
    return result;
  } catch (error) {
    console.error('Error creating button:', error);
    return { success: false, error: error.message };
  }
};

// Update button
export const updateButton = async (buttonId, buttonData) => {
  try {
    const result = await updateRecord(`parent-buttons/${buttonId}`, buttonData);
    return result;
  } catch (error) {
    console.error('Error updating button:', error);
    return { success: false, error: error.message };
  }
};

// Delete button
export const deleteButton = async (buttonId) => {
  try {
    const result = await deleteRecord(`parent-buttons/${buttonId}`);
    return result;
  } catch (error) {
    console.error('Error deleting button:', error);
    return { success: false, error: error.message };
  }
};

// Get child status
export const getChildStatus = async (childId) => {
  try {
    const result = await getAllRecords(`child-status/${childId}`);
    return result;
  } catch (error) {
    console.error('Error getting child status:', error);
    return { success: false, error: error.message, data: null };
  }
};
