import { Alert, AppState, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ExpoGoNotificationService {
  constructor() {
    this.isActive = true;
    this.appStateSubscription = null;
    this.sound = null;
    this.pollingInterval = null;
    this.onNewMessage = null;
  }

  // Initialize service untuk Expo Go
  async initialize() {
    try {
      // Setup app state listener
      this.setupAppStateListener();
      
      // Load notification sound
      await this.loadNotificationSound();
      
      console.log('✅ ExpoGo Notification Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      return false;
    }
  }

  // Load notification sound
  async loadNotificationSound() {
    try {
      // Use default system sound or a simple beep
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
        { shouldPlay: false }
      );
      this.sound = sound;
    } catch (error) {
      console.log('No notification sound available, using silent mode');
    }
  }

  // Setup app state listener
  setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      this.isActive = nextAppState === 'active';
      
      if (nextAppState === 'background') {
        this.startBackgroundPolling();
      } else if (nextAppState === 'active') {
        this.stopBackgroundPolling();
        this.checkMissedMessages();
      }
    });
  }

  // Start background polling (simulasi)
  startBackgroundPolling() {
    this.stopBackgroundPolling(); // Clear existing
    
    // Polling setiap 10 detik saat app di background
    this.pollingInterval = setInterval(() => {
      if (!this.isActive && this.onNewMessage) {
        this.onNewMessage();
      }
    }, 10000);
  }

  // Stop background polling
  stopBackgroundPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Check missed messages saat app kembali aktif
  async checkMissedMessages() {
    try {
      const lastCheck = await AsyncStorage.getItem('lastMessageCheck');
      const lastCheckTime = lastCheck ? parseInt(lastCheck) : Date.now() - 300000;
      const now = Date.now();
      
      if (now - lastCheckTime > 30000) { // 30 detik
        console.log('Checking for missed messages...');
        if (this.onNewMessage) {
          this.onNewMessage();
        }
      }
    } catch (error) {
      console.error('Error checking missed messages:', error);
    }
  }

  // Set callback untuk message baru
  setNewMessageCallback(callback) {
    this.onNewMessage = callback;
  }

  // Tampilkan notifikasi dengan Alert dan effects
  async showNotification(title, message, options = {}) {
    try {
      // Vibrate
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Play sound
      if (this.sound) {
        await this.sound.replayAsync();
      }

      // Show Alert dengan style yang mirip notifikasi
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Close',
            style: 'cancel',
          },
          {
            text: 'View',
            onPress: options.onPress || (() => {}),
          },
        ],
        { 
          cancelable: true,
          // Untuk Android, alert akan muncul di atas aplikasi lain
        }
      );

      // Update last check time
      await AsyncStorage.setItem('lastMessageCheck', Date.now().toString());
      
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // Shortcut untuk message notifikasi
  async showChildMessage(childName, message, onPress) {
    const title = `💬 Pesan dari ${childName}`;
    return await this.showNotification(title, message, { onPress });
  }

  // Shortcut untuk status notifikasi
  async showChildStatus(childName, status, onPress) {
    const title = `📱 Status ${childName}`;
    const message = `Anak Anda ${status}`;
    return await this.showNotification(title, message, { onPress });
  }

  // Simulasi badge count dengan AsyncStorage
  async setBadgeCount(count) {
    try {
      await AsyncStorage.setItem('badgeCount', count.toString());
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Get badge count
  async getBadgeCount() {
    try {
      const count = await AsyncStorage.getItem('badgeCount');
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Test notification
  async testNotification() {
    await this.showNotification(
      '🧪 Test Notification',
      'Ini adalah test notifikasi untuk Expo Go!',
      {
        onPress: () => console.log('Test notification pressed')
      }
    );
  }

  // Cleanup
  cleanup() {
    this.stopBackgroundPolling();
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    if (this.sound) {
      this.sound.unloadAsync();
    }
  }
}

export default new ExpoGoNotificationService();