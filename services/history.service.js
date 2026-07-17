import { createRecord, queryRecords, subscribeToQuery } from './database.service';

/**
 * Log a communication event when a child presses a button
 * @param {string} childEmail 
 * @param {string} childId 
 * @param {string} childName 
 * @param {string} message 
 */
export const logCommunication = async (childEmail, childId, childName, message) => {
  try {
    // Get parent connections
    const connectionsResult = await queryRecords('parent-child-connections', 'childEmail', childEmail);

    if (!connectionsResult.success || connectionsResult.data.length === 0) {
      console.log('No parent connection found for history log');
      return { success: false, error: 'No parent connection found' };
    }

    // Filter active connections
    const activeConnections = connectionsResult.data.filter(conn => conn.status === 'active');

    if (activeConnections.length === 0) {
      console.log('No active parent connection found for history log');
      return { success: false, error: 'No active parent connection found' };
    }

    // Send history log to all active parents
    const promises = activeConnections.map(conn => {
      return createRecord('communication-history', {
        childId: childId,
        childEmail: childEmail,
        childName: childName,
        parentId: conn.parentId,
        parentEmail: conn.parentEmail,
        message: message,
        timestamp: Date.now()
      });
    });

    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    console.error('Error logging communication history:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch communication history for a specific parent
 * @param {string} parentId 
 */
export const getParentHistory = async (parentId) => {
  return await queryRecords('communication-history', 'parentId', parentId);
};

/**
 * Subscribe to communication history for real-time updates
 * @param {string} parentId 
 * @param {Function} callback 
 */
export const subscribeToHistory = (parentId, callback) => {
  return subscribeToQuery('communication-history', 'parentId', parentId, callback);
};
