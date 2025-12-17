import { createRecord, queryRecords, deleteRecord } from './database.service';

/**
 * Invite Service
 * Handles invite code operations
 */

// Create invite code
export const createInviteCode = async (inviteData) => {
  try {
    const result = await createRecord('invite-codes', inviteData);
    return result;
  } catch (error) {
    console.error('Error creating invite code:', error);
    return { success: false, error: error.message };
  }
};

// Get invite code by code value
export const getInviteByCode = async (code) => {
  try {
    const result = await queryRecords('invite-codes', 'code', code);
    return result;
  } catch (error) {
    console.error('Error getting invite code:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Delete invite code
export const deleteInviteCode = async (inviteId) => {
  try {
    const result = await deleteRecord(`invite-codes/${inviteId}`);
    return result;
  } catch (error) {
    console.error('Error deleting invite code:', error);
    return { success: false, error: error.message };
  }
};
