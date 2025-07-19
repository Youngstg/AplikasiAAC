import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Konfigurasi notifikasi untuk lokal notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.appStateSubscription = null;
    this.lastNotificationCheck = null;
  }

  // Registrasi untuk local notifications (kompatibel dengan Expo Go)
  async registerForLocalNotificationsAsync() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Child Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: true,
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    this.isInitialized = true;
    this.setupAppStateListener();
    
    return true;
  }

  // Setup listener untuk app state changes
  setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        this.lastNotificationCheck = Date.now();
        this.storeLastCheckTime();
      } else if (nextAppState === 'active') {
        this.checkMissedNotifications();
      }
    });
  }

  // Simpan waktu terakhir check notifikasi
  async storeLastCheckTime() {
    try {
      await AsyncStorage.setItem('lastNotificationCheck', Date.now().toString());
    } catch (error) {
      console.error('Error storing last check time:', error);
    }
  }

  // Ambil waktu terakhir check notifikasi
  async getLastCheckTime() {
    try {
      const time = await AsyncStorage.getItem('lastNotificationCheck');
      return time ? parseInt(time) : Date.now();
    } catch (error) {
      console.error('Error getting last check time:', error);
      return Date.now();
    }
  }

  // Check notifikasi yang terlewat saat app di background
  async checkMissedNotifications() {
    const lastCheck = await this.getLastCheckTime();
    const now = Date.now();
    
    // Jika app di background lebih dari 30 detik, anggap mungkin ada notifikasi terlewat
    if (now - lastCheck > 30000) {
      console.log('Checking for missed notifications...');
      // Trigger callback untuk check Firebase
      if (this.onMissedNotificationCheck) {
        this.onMissedNotificationCheck();
      }
    }
  }

  // Set callback untuk check notifikasi terlewat
  setMissedNotificationCallback(callback) {
    this.onMissedNotificationCheck = callback;
  }

  // Kirim notifikasi lokal
  async scheduleLocalNotification(title, body, data = {}) {
    if (!this.isInitialized) {
      console.warn('NotificationService not initialized');
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          sticky: false,
          autoDismiss: true,
        },
        trigger: null, // Kirim sekarang
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Kirim notifikasi untuk pesan anak
  async sendChildMessageNotification(childName, message) {
    return await this.scheduleLocalNotification(
      `💬 Pesan dari ${childName}`,
      message,
      {
        type: 'child_message',
        message: message,
        timestamp: Date.now()
      }
    );
  }

  // Kirim notifikasi untuk status anak
  async sendChildStatusNotification(childName, status) {
    return await this.scheduleLocalNotification(
      `📱 Status ${childName}`,
      `Anak Anda ${status}`,
      {
        type: 'child_status',
        status: status,
        timestamp: Date.now()
      }
    );
  }

  // Kirim notifikasi untuk pesan yang terlewat
  async sendMissedMessagesNotification(count) {
    if (count > 0) {
      return await this.scheduleLocalNotification(
        `📬 ${count} Pesan Baru`,
        `Anda memiliki ${count} pesan baru dari anak`,
        {
          type: 'missed_messages',
          count: count,
          timestamp: Date.now()
        }
      );
    }
  }

  // Listener untuk notifikasi yang diterima
  addNotificationReceivedListener(listener) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Listener untuk notifikasi yang di-tap
  addNotificationResponseReceivedListener(listener) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Hapus semua notifikasi
  async dismissAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  // Hapus notifikasi berdasarkan ID
  async dismissNotification(notificationId) {
    await Notifications.dismissNotificationAsync(notificationId);
  }

  // Get badge count
  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  }

  // Set badge count
  async setBadgeCount(count) {
    await Notifications.setBadgeCountAsync(count);
  }

  // Cleanup saat app ditutup
  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

export default new NotificationService();