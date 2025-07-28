import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  deleteDoc 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotificationService from './PushNotificationService';

class RealTimeNotificationService {
  constructor() {
    this.listeners = new Map(); // Menyimpan semua listeners
    this.isActive = false;
    this.currentUserId = null;
    this.unsubscribeFunctions = new Map();
  }

  // Initialize service
  async initialize() {
    try {
      this.currentUserId = await AsyncStorage.getItem('currentUserId');
      
      if (!this.currentUserId) {
        console.warn('No user ID found, cannot initialize real-time notifications');
        return false;
      }

      // Initialize push notification service dulu
      await PushNotificationService.initialize();
      
      // Setup real-time listeners
      this.setupMessageListener();
      this.setupStatusListener();
      this.setupNotificationTriggerListener();
      
      this.isActive = true;
      console.log('✅ Real-time Notification Service initialized');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize real-time notification service:', error);
      return false;
    }
  }

  // Setup listener untuk pesan baru
  setupMessageListener() {
    if (!this.currentUserId) return;

    try {
      // Query untuk pesan yang ditujukan ke user ini
      const messagesQuery = query(
        collection(db, 'notifications'),
        where('toId', '==', this.currentUserId),
        where('read', '==', false)
      );

      const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
        console.log('📨 Messages snapshot received, docs:', snapshot.size);
        
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const messageData = change.doc.data();
            const messageId = change.doc.id;
            
            console.log('🆕 New message detected:', messageData);
            
            // Trigger push notification untuk pesan baru
            await this.handleNewMessage(messageId, messageData);
          }
        });
      }, (error) => {
        console.error('❌ Message listener error:', error);
      });

      this.unsubscribeFunctions.set('messages', unsubscribe);
      console.log('✅ Message listener setup complete');
      
    } catch (error) {
      console.error('❌ Error setting up message listener:', error);
    }
  }

  // Setup listener untuk status updates
  setupStatusListener() {
    if (!this.currentUserId) return;

    try {
      // Query untuk status updates yang ditujukan ke user ini
      const statusQuery = query(
        collection(db, 'statusUpdates'),
        where('parentId', '==', this.currentUserId)
      );

      const unsubscribe = onSnapshot(statusQuery, async (snapshot) => {
        console.log('📱 Status snapshot received, docs:', snapshot.size);
        
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const statusData = change.doc.data();
            const statusId = change.doc.id;
            
            console.log('🆕 New status detected:', statusData);
            
            // Trigger push notification untuk status baru
            await this.handleNewStatus(statusId, statusData);
          }
        });
      }, (error) => {
        console.error('❌ Status listener error:', error);
      });

      this.unsubscribeFunctions.set('status', unsubscribe);
      console.log('✅ Status listener setup complete');
      
    } catch (error) {
      console.error('❌ Error setting up status listener:', error);
    }
  }

  // Setup listener untuk notification triggers (untuk notifikasi khusus)
  setupNotificationTriggerListener() {
    if (!this.currentUserId) return;

    try {
      // Query untuk notification triggers yang ditujukan ke user ini
      const triggerQuery = query(
        collection(db, 'notificationTriggers'),
        where('targetUserId', '==', this.currentUserId),
        where('processed', '==', false)
      );

      const unsubscribe = onSnapshot(triggerQuery, async (snapshot) => {
        console.log('🔔 Notification trigger snapshot received, docs:', snapshot.size);
        
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const triggerData = change.doc.data();
            const triggerId = change.doc.id;
            
            console.log('🎯 New notification trigger detected:', triggerData);
            
            // Process notification trigger
            await this.processNotificationTrigger(triggerId, triggerData);
          }
        });
      }, (error) => {
        console.error('❌ Notification trigger listener error:', error);
      });

      this.unsubscribeFunctions.set('triggers', unsubscribe);
      console.log('✅ Notification trigger listener setup complete');
      
    } catch (error) {
      console.error('❌ Error setting up notification trigger listener:', error);
    }
  }

  // Handle pesan baru
  async handleNewMessage(messageId, messageData) {
    try {
      const fromName = messageData.fromName || 'Anak';
      const message = messageData.message || 'Pesan baru';
      
      // Kirim push notification
      const success = await PushNotificationService.sendChildMessageToParent(
        this.currentUserId,
        fromName,
        message
      );

      if (success) {
        console.log('✅ Push notification sent for message:', messageId);
        
        // Tambahkan log ke notification history
        await this.logNotificationHistory('message', messageData, 'sent');
      } else {
        console.warn('⚠️ Failed to send push notification for message:', messageId);
        await this.logNotificationHistory('message', messageData, 'failed');
      }

    } catch (error) {
      console.error('❌ Error handling new message:', error);
    }
  }

  // Handle status baru
  async handleNewStatus(statusId, statusData) {
    try {
      const childName = statusData.childName || 'Anak';
      const status = statusData.status || 'menggunakan aplikasi';
      
      // Kirim push notification
      const success = await PushNotificationService.sendChildStatusToParent(
        this.currentUserId,
        childName,
        status
      );

      if (success) {
        console.log('✅ Push notification sent for status:', statusId);
        await this.logNotificationHistory('status', statusData, 'sent');
      } else {
        console.warn('⚠️ Failed to send push notification for status:', statusId);
        await this.logNotificationHistory('status', statusData, 'failed');
      }

    } catch (error) {
      console.error('❌ Error handling new status:', error);
    }
  }

  // Process notification trigger
  async processNotificationTrigger(triggerId, triggerData) {
    try {
      const { type, title, body, data } = triggerData;
      
      // Kirim push notification berdasarkan trigger
      const success = await PushNotificationService.sendPushNotification(
        this.currentUserId,
        title,
        body,
        data
      );

      if (success) {
        console.log('✅ Trigger notification sent:', triggerId);
        
        // Mark trigger sebagai processed
        await updateDoc(doc(db, 'notificationTriggers', triggerId), {
          processed: true,
          processedAt: serverTimestamp(),
          success: true
        });
        
        await this.logNotificationHistory('trigger', triggerData, 'sent');
      } else {
        console.warn('⚠️ Failed to send trigger notification:', triggerId);
        
        await updateDoc(doc(db, 'notificationTriggers', triggerId), {
          processed: true,
          processedAt: serverTimestamp(),
          success: false
        });
        
        await this.logNotificationHistory('trigger', triggerData, 'failed');
      }

    } catch (error) {
      console.error('❌ Error processing notification trigger:', error);
    }
  }

  // Log notification history
  async logNotificationHistory(type, data, status) {
    try {
      await addDoc(collection(db, 'notificationHistory'), {
        userId: this.currentUserId,
        type: type,
        data: data,
        status: status,
        timestamp: serverTimestamp(),
        platform: 'mobile'
      });
    } catch (error) {
      console.error('❌ Error logging notification history:', error);
    }
  }

  // Manual trigger untuk kirim notifikasi ke user lain
  async sendNotificationToUser(targetUserId, type, title, body, additionalData = {}) {
    try {
      // Buat notification trigger di Firebase
      const triggerData = {
        targetUserId: targetUserId,
        fromUserId: this.currentUserId,
        type: type,
        title: title,
        body: body,
        data: {
          ...additionalData,
          timestamp: Date.now()
        },
        processed: false,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'notificationTriggers'), triggerData);
      console.log('✅ Notification trigger created:', docRef.id);
      
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Error sending notification to user:', error);
      return null;
    }
  }

  // Shortcut untuk kirim pesan ke parent
  async notifyParentOfMessage(parentId, childName, message) {
    return await this.sendNotificationToUser(
      parentId,
      'child_message',
      `💬 Pesan dari ${childName}`,
      message,
      {
        childName: childName,
        message: message
      }
    );
  }

  // Shortcut untuk kirim status ke parent
  async notifyParentOfStatus(parentId, childName, status) {
    return await this.sendNotificationToUser(
      parentId,
      'child_status',
      `📱 Status ${childName}`,
      `Anak Anda ${status}`,
      {
        childName: childName,
        status: status
      }
    );
  }

  // Broadcast notification ke multiple users
  async broadcastNotification(userIds, title, body, data = {}) {
    try {
      const triggers = await Promise.allSettled(
        userIds.map(userId => this.sendNotificationToUser(userId, 'broadcast', title, body, data))
      );
      
      const successful = triggers.filter(result => result.status === 'fulfilled' && result.value).length;
      console.log(`📢 Created ${successful}/${userIds.length} notification triggers`);
      
      return successful;
      
    } catch (error) {
      console.error('❌ Error broadcasting notifications:', error);
      return 0;
    }
  }

  // Test real-time notification
  async testRealTimeNotification() {
    if (!this.currentUserId) {
      console.warn('No user ID for testing');
      return false;
    }

    return await this.sendNotificationToUser(
      this.currentUserId,
      'test',
      '🧪 Test Real-time Notification',
      'Ini adalah test real-time notification melalui Firebase!',
      {
        test: true
      }
    );
  }

  // Get notification history
  async getNotificationHistory(limit = 50) {
    try {
      const { getDocs } = await import('firebase/firestore');
      
      const historyQuery = query(
        collection(db, 'notificationHistory'),
        where('userId', '==', this.currentUserId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(historyQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
    } catch (error) {
      console.error('❌ Error getting notification history:', error);
      return [];
    }
  }

  // Cleanup notification history (hapus yang lama)
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - daysOld);
      
      const { getDocs } = await import('firebase/firestore');
      
      const oldNotificationsQuery = query(
        collection(db, 'notificationHistory'),
        where('userId', '==', this.currentUserId),
        where('timestamp', '<', cutoffTime)
      );

      const snapshot = await getDocs(oldNotificationsQuery);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`🗑️ Cleaned up ${snapshot.docs.length} old notifications`);
      return snapshot.docs.length;
      
    } catch (error) {
      console.error('❌ Error cleaning up old notifications:', error);
      return 0;
    }
  }

  // Stop semua listeners
  stopAllListeners() {
    this.unsubscribeFunctions.forEach((unsubscribe, key) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
        console.log(`✅ Unsubscribed from ${key} listener`);
      }
    });
    
    this.unsubscribeFunctions.clear();
    this.isActive = false;
  }

  // Cleanup
  cleanup() {
    this.stopAllListeners();
    PushNotificationService.cleanup();
    console.log('✅ Real-time Notification Service cleaned up');
  }

  // Get service status
  getStatus() {
    return {
      isActive: this.isActive,
      currentUserId: this.currentUserId,
      activeListeners: Array.from(this.unsubscribeFunctions.keys()),
      pushToken: PushNotificationService.getCurrentPushToken()
    };
  }
}

export default new RealTimeNotificationService();