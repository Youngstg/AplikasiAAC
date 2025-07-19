import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import NotificationService from './NotificationService';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

// Task untuk background notification check
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    console.log('Background task running...');
    
    // Ambil user ID dari AsyncStorage
    const userId = await AsyncStorage.getItem('currentUserId');
    if (!userId) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    // Ambil timestamp terakhir check
    const lastCheckTime = await AsyncStorage.getItem('lastNotificationCheck');
    const lastCheck = lastCheckTime ? parseInt(lastCheckTime) : Date.now() - 300000; // 5 menit yang lalu

    // Query notifikasi baru
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('toId', '==', userId),
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const snapshot = await getDocs(notificationsQuery);
    const newNotifications = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(notification => {
        const notificationTime = notification.timestamp?.seconds * 1000 || 0;
        return notificationTime > lastCheck;
      });

    // Kirim notifikasi jika ada pesan baru
    if (newNotifications.length > 0) {
      const latestNotification = newNotifications[0];
      await NotificationService.sendChildMessageNotification(
        latestNotification.fromName || 'Anak',
        latestNotification.message
      );
      
      // Update badge count
      await NotificationService.setBadgeCount(newNotifications.length);
    }

    // Update timestamp terakhir check
    await AsyncStorage.setItem('lastNotificationCheck', Date.now().toString());
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundNotificationService {
  static async register() {
    try {
      // Register background task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 15, // 15 detik minimal interval
        stopOnTerminate: false,
        startOnBoot: true,
      });
      
      console.log('Background notification task registered');
      return true;
    } catch (error) {
      console.error('Failed to register background task:', error);
      return false;
    }
  }

  static async unregister() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('Background notification task unregistered');
    } catch (error) {
      console.error('Failed to unregister background task:', error);
    }
  }

  static async isRegistered() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
      return isRegistered;
    } catch (error) {
      console.error('Error checking task registration:', error);
      return false;
    }
  }

  static async getStatus() {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      return status;
    } catch (error) {
      console.error('Error getting background fetch status:', error);
      return BackgroundFetch.BackgroundFetchStatus.Denied;
    }
  }
}

export default BackgroundNotificationService;