import { createRecord, queryRecords, updateRecord, subscribeToQuery } from './database.service';

/**
 * Notification Service
 * Handles notification operations
 */

// Send notification
export const sendNotification = async (notificationData) => {
  try {
    const result = await createRecord('notifications', {
      ...notificationData,
      read: false
    });
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

// Get notifications for user
export const getNotifications = async (userEmail) => {
  try {
    const result = await queryRecords('notifications', 'toEmail', userEmail);
    return result;
  } catch (error) {
    console.error('Error getting notifications:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  try {
    const result = await updateRecord(`notifications/${notificationId}`, { read: true });
    return result;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

// Subscribe to notifications (real-time)
export const subscribeToNotifications = (userEmail, callback) => {
  return subscribeToQuery('notifications', 'toEmail', userEmail, callback);
};

// Send notification from child to parent
export const sendNotificationToParent = async (childEmail, childId, childName, message) => {
  try {
    // Get parent connections
    const connectionsResult = await queryRecords('parent-child-connections', 'childEmail', childEmail);

    if (!connectionsResult.success || connectionsResult.data.length === 0) {
      console.log('No parent connection found');
      return { success: false, error: 'No parent connection found' };
    }

    // Filter active connections
    const activeConnections = connectionsResult.data.filter(conn => conn.status === 'active');

    if (activeConnections.length === 0) {
      return { success: false, error: 'No active parent connection found' };
    }

    // Send notification to each connected parent
    const results = [];
    for (const connection of activeConnections) {
      const result = await sendNotification({
        fromId: childId,
        fromEmail: childEmail,
        fromName: childName,
        toId: connection.parentId,
        toEmail: connection.parentEmail,
        toName: connection.parentName,
        message: message,
        type: 'button_pressed'
      });
      results.push(result);
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error sending notification to parent:', error);
    return { success: false, error: error.message };
  }
};
