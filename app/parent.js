import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import * as ScreenOrientation from 'expo-screen-orientation';
import PushNotificationService from '../services/PushNotificationService';
import RealTimeNotificationService from '../services/RealTimeNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationIndicator from '../components/NotificationIndicator';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { subscribeToQuery, subscribeToPath, getRecord } from '../services/database.service';
import { getParentChildConnections } from '../services/parent.service';
import { markAsRead as markNotificationAsRead } from '../services/notification.service';

export default function ParentDashboard() {
  const { logout, currentUser } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [notificationStatus, setNotificationStatus] = useState('Initializing...');
  const [showNotificationIndicator, setShowNotificationIndicator] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [childId, setChildId] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Simpan user ID untuk background task
    AsyncStorage.setItem('currentUserId', currentUser.uid);

    // Load first connected child's battery info
    const loadChildInfo = async () => {
      try {
        const result = await getParentChildConnections(currentUser.email);
        if (result.success && result.data.length > 0) {
          const activeChild = result.data.find(conn => conn.status === 'active');
          if (activeChild) {
            setChildId(activeChild.childId);
          }
        }
      } catch (error) {
        console.error('Error loading child info:', error);
      }
    };

    loadChildInfo();

    // Subscribe to notifications using Realtime Database
    const unsubscribe = subscribeToQuery('notifications', 'toId', currentUser.uid, (notificationsList) => {
      // Sort by timestamp (newest first)
      notificationsList.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });

      // Cek apakah ada notifikasi baru
      const newNotifications = notificationsList.filter(n => !n.read);
      const currentUnreadCount = newNotifications.length;

      // Kirim notification hanya jika ada peningkatan jumlah notifikasi
      if (currentUnreadCount > lastNotificationCount && currentUnreadCount > 0) {
        const latestNotification = newNotifications[0];
        if (latestNotification && latestNotification.type === 'button_pressed') {
          // Tampilkan visual indicator
          setCurrentNotification({
            title: `Pesan dari ${latestNotification.fromName || 'Anak'}`,
            message: latestNotification.message,
            id: latestNotification.id
          });
          setShowNotificationIndicator(true);

          // Show alert for new message
          Alert.alert(
            `💬 ${latestNotification.fromName || 'Anak'}`,
            latestNotification.message,
            [
              {
                text: 'Mark as Read',
                onPress: () => markAsRead(latestNotification.id)
              },
              { text: 'OK' }
            ]
          );
        }
      }

      setNotifications(notificationsList);
      setUnreadCount(currentUnreadCount);
      setLastNotificationCount(currentUnreadCount);

      // Badge count will be handled by PushNotificationService
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Battery info listener
  useEffect(() => {
    if (!childId) return;

    const unsubscribe = subscribeToPath(`child-status/${childId}`, (data) => {
      if (data) {
        setBatteryLevel(data?.batteryLevel || null);
      }
    });

    return () => unsubscribe();
  }, [childId]);

  useEffect(() => {
    // Unlock orientation for parent page
    const unlockOrientation = async () => {
      await ScreenOrientation.unlockAsync();
    };
    
    unlockOrientation();

    // Initialize notification services
    const initNotifications = async () => {
      try {
        // Initialize push notification service first
        const pushSuccess = await PushNotificationService.initialize();
        
        if (pushSuccess) {
          // Initialize real-time notification service
          const realTimeSuccess = await RealTimeNotificationService.initialize();
          
          if (realTimeSuccess) {
            setNotificationStatus('✅ Push notifications enabled');
            console.log('✅ All notification services initialized successfully');
          } else {
            setNotificationStatus('⚠️ Push enabled, real-time failed');
            console.warn('Push notifications working, but real-time service failed');
          }
        } else {
          setNotificationStatus('❌ Push notifications failed');
          console.error('Failed to initialize push notification service');
        }

        return () => {
          RealTimeNotificationService.cleanup();
          PushNotificationService.cleanup();
        };
      } catch (error) {
        setNotificationStatus('❌ Error setting up notifications');
        console.error('Notification setup error:', error);
      }
    };

    initNotifications();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  // Dynamic layout based on orientation
  const isLandscape = screenData.width > screenData.height;
  const getMainContentStyle = () => {
    return isLandscape ? styles.mainContentLandscape : styles.mainContentPortrait;
  };

  const getLeftColumnStyle = () => {
    return isLandscape ? styles.leftColumnLandscape : styles.leftColumnPortrait;
  };

  const getRightColumnStyle = () => {
    return isLandscape ? styles.rightColumnLandscape : styles.rightColumnPortrait;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Notification Indicator */}
        <NotificationIndicator
          visible={showNotificationIndicator}
          title={currentNotification?.title}
          message={currentNotification?.message}
          onPress={() => {
            if (currentNotification?.id) {
              markAsRead(currentNotification.id);
            }
            setShowNotificationIndicator(false);
          }}
          onClose={() => setShowNotificationIndicator(false)}
        />

        <View style={getMainContentStyle()}>
          {/* Left Column - Status & Messages */}
          <View style={getLeftColumnStyle()}>
            {/* Child Status Card */}
            <View style={styles.childStatusCard}>
              <View style={styles.childAvatar}>
                <Text style={styles.avatarText}>C</Text>
              </View>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>Child Tablet</Text>
                <View style={styles.statusRow}>
                  <Text style={styles.statusText}>Active</Text>
                  <View style={styles.batteryContainer}>
                    <Text style={styles.batteryLabel}>Battery: </Text>
                    <Text style={styles.batteryText}>{batteryLevel !== null ? `${batteryLevel}%` : '--'}</Text>
                  </View>
                </View>
                <Text style={styles.notificationStatus}>{notificationStatus}</Text>
              </View>
            </View>

            {/* Recent Messages */}
            {notifications.length > 0 && (
              <View style={styles.messageCard}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageTitle}>Recent Messages</Text>
                </View>
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>{unreadCount} new</Text>
                  </View>
                )}
                <View style={styles.messagesList}>
                  {notifications.slice(0, isLandscape ? 2 : 3).map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      style={[
                        styles.messageItem,
                        !notification.read && styles.unreadMessage
                      ]}
                      onPress={() => markAsRead(notification.id)}
                    >
                      <Text style={styles.messageText}>{notification.message}</Text>
                      <Text style={styles.messageTime}>
                        {formatTimestamp(notification.timestamp)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Right Column - Menu Grid */}
          <View style={getRightColumnStyle()}>
            <View style={styles.menuGrid}>
              <TouchableOpacity 
                style={[styles.menuCard, styles.manageChildrenCard]}
                onPress={() => router.push('/manage-children')}
              >
                <Text style={styles.menuTitle}>Manage{'\n'}Children</Text>
                <Text style={styles.menuDescription}>Invite{'\n'}Approve{'\n'}Link</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuCard, styles.addWordCard]}
                onPress={() => router.push('/create-button')}
              >
                <Text style={styles.menuTitle}>Add{'\n'}Word</Text>
                <Text style={styles.menuDescription}>Word{'\n'}Image{'\n'}Sound</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuCard, styles.editWordCard]}
                onPress={() => router.push('/edit-word')}
              >
                <Text style={styles.menuTitle}>Edit{'\n'}Word</Text>
                <Text style={styles.menuDescription}>Modify{'\n'}Existing{'\n'}Words</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuCard, styles.logoutCard]}
                onPress={handleLogout}
              >
                <Text style={styles.menuTitle}>Logout</Text>
                <Text style={styles.menuDescription}>Sign Out{'\n'}Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  
  // Responsive layout
  mainContentLandscape: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  mainContentPortrait: {
    flexDirection: 'column',
    gap: 20,
    marginBottom: 30,
  },
  leftColumnLandscape: {
    flex: 0.3,
    gap: 15,
  },
  leftColumnPortrait: {
    gap: 20,
  },
  rightColumnLandscape: {
    flex: 0.7,
  },
  rightColumnPortrait: {
    width: '100%',
  },
  
  // Child Status Card
  childStatusCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 30,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 4,
  },
  batteryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  testButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Message Card
  messageCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationBadge: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesList: {
    gap: 10,
  },
  messageItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#e9ecef',
  },
  unreadMessage: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196f3',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },

  // Menu Grid
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  menuCard: {
    width: '48.5%',
    aspectRatio: 1,
    borderRadius: 15,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  manageChildrenCard: {
    backgroundColor: '#c9b1f0',
  },
  addWordCard: {
    backgroundColor: '#a8d0f0',
  },
  editWordCard: {
    backgroundColor: '#a8f0c0',
  },
  testCard: {
    backgroundColor: '#ffd93d',
  },
  logoutCard: {
    backgroundColor: '#f0a8a8',
  },
  menuTitle: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  menuDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'left',
    lineHeight: 16,
    alignSelf: 'flex-start',
  },

  // Logout
  logoutContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
