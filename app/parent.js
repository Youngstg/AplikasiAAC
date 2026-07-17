import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import NotificationIndicator from '../components/NotificationIndicator';
import { subscribeToQuery, subscribeToPath } from '../services/database.service';
import { getParentChildConnections } from '../services/parent.service';
import { markAsRead as markNotificationAsRead } from '../services/notification.service';
import DeviceStatusCard from '../components/parent/DeviceStatusCard';
import MenuGrid from '../components/parent/MenuGrid';

export default function ParentDashboard() {
  const { logout, currentUser } = useAuth();
  const router = useRouter();
  
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showNotificationIndicator, setShowNotificationIndicator] = useState(false);
  
  // Device Status State
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [childId, setChildId] = useState(null);
  const [childName, setChildName] = useState('Child Tablet');
  const [deviceActive, setDeviceActive] = useState(false);

  // We fetch connections to get the child ID
  useEffect(() => {
    if (!currentUser?.email) return;

    const loadChildInfo = async () => {
      try {
        const result = await getParentChildConnections(currentUser.email);
        if (result.success && result.data.length > 0) {
          const activeChild = result.data.find(conn => conn.status === 'active');
          if (activeChild) {
            setChildId(activeChild.childId);
            setChildName(activeChild.childName || 'Child Tablet');
            setDeviceActive(true); // If connected
          }
        }
      } catch (error) {
        console.error('Error loading child info:', error);
      }
    };
    loadChildInfo();
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

  // Notifications listener for realtime alerts
  useEffect(() => {
    if (!currentUser?.uid) return;
    let lastNotificationCount = 0;

    const unsubscribe = subscribeToQuery('notifications', 'toId', currentUser.uid, (notificationsList) => {
      const newNotifications = notificationsList.filter(n => !n.read);
      const currentUnreadCount = newNotifications.length;

      if (currentUnreadCount > lastNotificationCount && currentUnreadCount > 0) {
        // Sort by timestamp newest first
        newNotifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const latestNotification = newNotifications[0];
        
        if (latestNotification && latestNotification.type === 'button_pressed') {
          setCurrentNotification({
            title: `Pesan dari ${latestNotification.fromName || 'Anak'}`,
            message: latestNotification.message,
            id: latestNotification.id
          });
          setShowNotificationIndicator(true);

          if (Platform.OS !== 'web') {
            Alert.alert(
              `💬 ${latestNotification.fromName || 'Anak'}`,
              latestNotification.message,
              [
                { text: 'Mark as Read', onPress: () => markAsRead(latestNotification.id) },
                { text: 'OK' }
              ]
            );
          }
        }
      }
      lastNotificationCount = currentUnreadCount;
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) {
        try {
          await logout();
          router.replace('/login');
        } catch (error) {
          console.error('Logout error:', error);
          alert('Failed to logout');
        }
      }
    } else {
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
    }
  };

  const menuItems = [
    {
      title: 'Manage Children',
      iconName: 'users',
      backgroundColor: '#c9b1f0', // Pastel purple
      items: ['Invite', 'Approve', 'Link'],
      onPress: () => router.push('/manage-children')
    },
    {
      title: 'Add Word',
      iconName: 'plus-circle',
      backgroundColor: '#a8d0f0', // Pastel blue
      items: ['Word', 'Image', 'Sound'],
      onPress: () => router.push('/create-button')
    },
    {
      title: 'Edit Word',
      iconName: 'edit',
      backgroundColor: '#a8f0c0', // Pastel green
      items: ['Modify', 'Existing', 'Words'],
      onPress: () => router.push('/edit-word')
    },
    {
      title: 'Logout',
      iconName: 'log-out',
      backgroundColor: '#f0a8a8', // Pastel pink/red
      items: ['Sign Out', 'Account'],
      onPress: handleLogout
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.content}>
        <DeviceStatusCard 
          deviceName={childName}
          isActive={deviceActive}
          batteryLevel={batteryLevel}
          // alertMessage="Push notifications failed" // uncomment or set dynamically if needed
        />

        <MenuGrid menus={menuItems} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    padding: 16,
  }
});
