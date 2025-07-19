// Script untuk testing notifikasi local (kompatibel dengan Expo Go)
import NotificationService from './services/NotificationService.js';
import BackgroundNotificationService from './services/BackgroundNotificationService.js';

const testNotification = async () => {
  console.log('Testing local notifications...');
  
  try {
    // Initialize service
    const success = await NotificationService.registerForLocalNotificationsAsync();
    if (success) {
      console.log('✅ Local notification service initialized');
    } else {
      console.log('❌ Failed to initialize notifications');
      return;
    }

    // Test sending a notification
    const notificationId = await NotificationService.sendChildMessageNotification(
      'Test Child',
      'Ini adalah test notifikasi local! 🎉'
    );
    
    console.log('✅ Test notification sent with ID:', notificationId);
    
    // Test badge count
    await NotificationService.setBadgeCount(3);
    console.log('✅ Badge count set to 3');
    
    // Get current badge count
    const currentBadge = await NotificationService.getBadgeCount();
    console.log('Current badge count:', currentBadge);

    // Test background service
    const backgroundRegistered = await BackgroundNotificationService.register();
    if (backgroundRegistered) {
      console.log('✅ Background service registered');
    }

    const backgroundStatus = await BackgroundNotificationService.getStatus();
    console.log('Background fetch status:', backgroundStatus);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testNotification();
}

export default testNotification;