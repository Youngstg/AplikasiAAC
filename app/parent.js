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
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import * as ScreenOrientation from 'expo-screen-orientation';
import ExpoGoNotificationService from '../services/ExpoGoNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationIndicator from '../components/NotificationIndicator';

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

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Simpan user ID untuk background task
    AsyncStorage.setItem('currentUserId', currentUser.uid);

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('toId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by timestamp (newest first)
      notificationsList.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return b.timestamp.seconds - a.timestamp.seconds;
        }
        return 0;
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
          
          // Tampilkan Alert juga
          ExpoGoNotificationService.showChildMessage(
            latestNotification.fromName || 'Anak',
            latestNotification.message,
            () => {
              // Navigate to message detail atau mark as read
              markAsRead(latestNotification.id);
            }
          );
        }
      }

      setNotifications(notificationsList);
      setUnreadCount(currentUnreadCount);
      setLastNotificationCount(currentUnreadCount);
      
      // Update badge count
      ExpoGoNotificationService.setBadgeCount(currentUnreadCount);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    // Unlock orientation for parent page
    const unlockOrientation = async () => {
      await ScreenOrientation.unlockAsync();
    };
    
    unlockOrientation();

    // Initialize notification service
    const initNotifications = async () => {
      try {
        const success = await ExpoGoNotificationService.initialize();
        if (success) {
          setNotificationStatus('✅ Expo Go notifications enabled');
        } else {
          setNotificationStatus('❌ Notifications disabled');
        }
        
        // Setup callback untuk message baru
        ExpoGoNotificationService.setNewMessageCallback(() => {
          console.log('Checking for new messages...');
          // Firebase listener akan handle ini otomatis
        });

        return () => {
          ExpoGoNotificationService.cleanup();
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
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
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
                <Text style={styles.avatarText}>👶</Text>
              </View>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>Child Tablet</Text>
                <View style={styles.statusRow}>
                  <Text style={styles.statusText}>Active</Text>
                  <View style={styles.batteryContainer}>
                    <Text style={styles.batteryIcon}>🔋</Text>
                    <Text style={styles.batteryText}>50%</Text>
                  </View>
                </View>
                <Text style={styles.notificationStatus}>{notificationStatus}</Text>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={() => {
                    ExpoGoNotificationService.testNotification();
                  }}
                >
                  <Text style={styles.testButtonText}>Test Notification</Text>
                </TouchableOpacity>
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
                style={[styles.menuCard, styles.addWordCard]}
                onPress={() => router.push('/create-button')}
              >
                <Text style={styles.menuTitle}>Add{'\n'}Word</Text>
                <Text style={styles.menuDescription}>Word{'\n'}Image{'\n'}Sound</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuCard, styles.pinWordCard]}
                onPress={() => router.push('/manage-children')}
              >
                <Text style={styles.menuTitle}>Connect{'\n'}Child</Text>
                <Text style={styles.menuDescription}>Manage{'\n'}Children</Text>
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
  batteryIcon: {
    fontSize: 16,
    marginRight: 5,
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
  addWordCard: {
    backgroundColor: '#a8d0f0',
  },
  pinWordCard: {
    backgroundColor: '#f0a8c0',
  },
  editWordCard: {
    backgroundColor: '#a8f0c0',
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