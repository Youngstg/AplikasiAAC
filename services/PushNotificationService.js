import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp, collection, addDoc, getDoc } from 'firebase/firestore';

// Konfigurasi notifikasi handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.isInitialized = false;
  }

  // Mendapatkan Expo Push Token
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Child Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: true,
        showBadge: true,
      });
    }

    if (Device.isDevice) {
      // Expo Go (Android) no longer supports remote push notifications (SDK 53+)
      if (Constants?.appOwnership === 'expo' && Platform.OS === 'android') {
        console.warn('expo-notifications remote push is not supported in Expo Go on Android. Use a development build.');
        return null;
      }
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {    
        alert('Failed to get push token for push notification!');
        return null;
      }
      
      // Mendapatkan project ID dari Constants atau environment
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                       Constants.manifest2?.extra?.eas?.projectId || 
                       'bb6e4376-4f41-428e-bcbf-f5b5a176c85e';
      
      console.log('🔧 Using project ID:', projectId);
      console.log('🔧 Device info:', Device.osName, Device.modelName);
      console.log('🔧 Platform:', Platform.OS);
      
      try {
        token = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
        console.log('✅ Expo Push Token received:', token.data);
        this.expoPushToken = token.data;
        
        // Simpan token ke AsyncStorage
        await AsyncStorage.setItem('expoPushToken', token.data);
        
      } catch (error) {
        console.error('❌ Error getting push token:', error);
        return null;
      }
    } else {
      alert('Must use physical device for Push Notifications');
      return null;
    }

    return token?.data || null;
  }

  // Initialize service
  async initialize() {
    try {
      // Dapatkan push token
      const token = await this.registerForPushNotificationsAsync();
      
      if (token) {
        // Simpan token ke Firebase untuk user ini
        await this.savePushTokenToFirebase(token);
        
        // Setup listeners
        this.setupNotificationListeners();
        
        this.isInitialized = true;
        console.log('✅ Push Notification Service initialized');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to initialize push notification service:', error);
      return false;
    }
  }

  // Simpan push token ke Firebase
  async savePushTokenToFirebase(token) {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      if (!userId) {
        console.warn('No user ID found, cannot save push token');
        return;
      }

      const tokenDoc = doc(db, 'pushTokens', userId);
      await setDoc(tokenDoc, {
        token: token,
        userId: userId,
        platform: Platform.OS,
        deviceId: Device.osName,
        updatedAt: serverTimestamp(),
        active: true
      }, { merge: true });

      console.log('✅ Push token saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving push token to Firebase:', error);
    }
  }

  // Setup notification listeners
  setupNotificationListeners() {
    // Listener untuk notifikasi yang diterima saat app foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener untuk notifikasi yang di-tap
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle notifikasi yang diterima
  async handleNotificationReceived(notification) {
    const data = notification.request.content.data;
    
    // Update badge count
    const currentBadge = await Notifications.getBadgeCountAsync();
    await Notifications.setBadgeCountAsync(currentBadge + 1);
    
    // Log untuk debugging
    console.log('Notification data:', data);
  }

  // Handle response notifikasi (ketika di-tap)
  handleNotificationResponse(response) {
    const data = response.notification.request.content.data;
    
    // Navigate berdasarkan tipe notifikasi
    if (data.type === 'child_message') {
      // Navigation logic ke chat screen
      console.log('Navigate to chat for message:', data.message);
    } else if (data.type === 'child_status') {
      // Navigation logic ke status screen
      console.log('Navigate to status for:', data.status);
    }
  }

  // Kirim push notification ke user tertentu
  async sendPushNotification(targetUserId, title, body, data = {}) {
    try {
      // Ambil push token dari Firebase
      const tokenSnapshot = await this.getPushTokenFromFirebase(targetUserId);
      
      if (!tokenSnapshot) {
        console.warn('No push token found for user:', targetUserId);
        return false;
      }

      const pushToken = tokenSnapshot.token;
      
      // Kirim ke Expo Push API
      const message = {
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        badge: 1,
        priority: 'high',
        channelId: 'default',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data?.status === 'ok') {
        console.log('✅ Push notification sent successfully');
        
        // Log ke Firebase untuk tracking
        await this.logNotificationSent(targetUserId, title, body, data);
        
        return true;
      } else {
        console.error('❌ Failed to send push notification:', result);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return false;
    }
  }

  // Ambil push token dari Firebase
  async getPushTokenFromFirebase(userId) {
    try {
      const tokenDoc = doc(db, 'pushTokens', userId);
      const snapshot = await getDoc(tokenDoc);
      
      if (snapshot.exists()) {
        return snapshot.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting push token from Firebase:', error);
      return null;
    }
  }

  // Log notifikasi yang dikirim
  async logNotificationSent(targetUserId, title, body, data) {
    try {
      const currentUserId = await AsyncStorage.getItem('currentUserId');
      
      await addDoc(collection(db, 'notificationLogs'), {
        fromUserId: currentUserId,
        toUserId: targetUserId,
        title: title,
        body: body,
        data: data,
        sentAt: serverTimestamp(),
        platform: Platform.OS,
        type: 'push_notification'
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Kirim notifikasi pesan anak ke orang tua
  async sendChildMessageToParent(parentUserId, childName, message) {
    return await this.sendPushNotification(
      parentUserId,
      `💬 Pesan dari ${childName}`,
      message,
      {
        type: 'child_message',
        childName: childName,
        message: message,
        timestamp: Date.now()
      }
    );
  }

  // Kirim notifikasi status anak ke orang tua
  async sendChildStatusToParent(parentUserId, childName, status) {
    return await this.sendPushNotification(
      parentUserId,
      `📱 Status ${childName}`,
      `Anak Anda ${status}`,
      {
        type: 'child_status',
        childName: childName,
        status: status,
        timestamp: Date.now()
      }
    );
  }

  // Broadcast ke multiple users
  async sendBroadcastNotification(userIds, title, body, data = {}) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendPushNotification(userId, title, body, data))
    );
    
    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
    console.log(`📢 Broadcast sent to ${successful}/${userIds.length} users`);
    
    return successful;
  }

  // Test push notification
  async testPushNotification() {
    const currentUserId = await AsyncStorage.getItem('currentUserId');
    if (currentUserId) {
      return await this.sendPushNotification(
        currentUserId,
        '🧪 Test Push Notification',
        'Ini adalah test push notification!',
        {
          type: 'test',
          timestamp: Date.now()
        }
      );
    }
    return false;
  }

  // Get current push token
  getCurrentPushToken() {
    return this.expoPushToken;
  }

  // Clear badge count
  async clearBadgeCount() {
    await Notifications.setBadgeCountAsync(0);
  }

  // Cleanup
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default new PushNotificationService();
