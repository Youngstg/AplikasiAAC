import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  Platform,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import NotificationIndicator from '../components/NotificationIndicator';
import { subscribeToQuery, subscribeToPath } from '../services/database.service';
import { getParentChildConnections } from '../services/parent.service';
import { markAsRead as markNotificationAsRead } from '../services/notification.service';
import { subscribeToHistory } from '../services/history.service';
import AuthLayout from '../components/AuthLayout';
import DeviceStatusCard from '../components/parent/DeviceStatusCard';
import MenuGrid from '../components/parent/MenuGrid';

export default function ParentDashboard() {
  const { logout, currentUser } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768; // Tablet or Web
  
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showNotificationIndicator, setShowNotificationIndicator] = useState(false);
  
  // Device Status State
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [childId, setChildId] = useState(null);
  const [childName, setChildName] = useState('Child Tablet');
  const [deviceActive, setDeviceActive] = useState(false);

  // History State
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch connections
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
            setDeviceActive(true);
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

  // Notifications listener
  useEffect(() => {
    if (!currentUser?.uid) return;
    let lastNotificationCount = 0;
    const unsubscribe = subscribeToQuery('notifications', 'toId', currentUser.uid, (notificationsList) => {
      const newNotifications = notificationsList.filter(n => !n.read);
      const currentUnreadCount = newNotifications.length;
      if (currentUnreadCount > lastNotificationCount && currentUnreadCount > 0) {
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

  // History listener
  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoadingHistory(true);
    const unsubscribe = subscribeToHistory(currentUser.uid, (logs) => {
      const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);
      setHistoryLogs(sortedLogs);
      setLoadingHistory(false);
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
          alert('Failed to logout');
        }
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => {
            try { await logout(); router.replace('/login'); } catch (error) { Alert.alert('Error', 'Failed to logout'); }
          }
        }
      ]);
    }
  };

  const menuItems = [
    {
      title: 'Manage Children',
      iconName: 'users',
      backgroundColor: '#c9b1f0',
      items: ['Invite', 'Approve', 'Link'],
      onPress: () => router.push('/manage-children')
    },
    {
      title: 'Add Word',
      iconName: 'plus-circle',
      backgroundColor: '#a8d0f0',
      items: ['Word', 'Image', 'Sound'],
      onPress: () => router.push('/create-button')
    },
    {
      title: 'Edit Word',
      iconName: 'edit',
      backgroundColor: '#a8f0c0',
      items: ['Modify', 'Existing', 'Words'],
      onPress: () => router.push('/edit-word')
    },
    {
      title: 'Logout',
      iconName: 'log-out',
      backgroundColor: '#f0a8a8',
      items: ['Sign Out', 'Account'],
      onPress: handleLogout
    }
  ];

  // Group logs by date
  const groupLogsByDate = (logs) => {
    const groups = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateString = '';
      if (date.toDateString() === today.toDateString()) {
        dateString = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateString = 'Yesterday';
      } else {
        dateString = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      }
      if (!groups[dateString]) groups[dateString] = [];
      groups[dateString].push(log);
    });
    return groups;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const groupedLogs = groupLogsByDate(historyLogs);

  const renderHistoryPanel = () => (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Recent Activity</Text>
      {loadingHistory ? (
        <ActivityIndicator size="large" color="#3a7bd5" style={{ marginTop: 40 }} />
      ) : historyLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="clock" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No history yet.</Text>
        </View>
      ) : (
        <ScrollView style={styles.historyScroll} contentContainerStyle={{ paddingBottom: 20 }}>
          {Object.keys(groupedLogs).map((dateGroup, index) => (
            <View key={index} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{dateGroup}</Text>
              <View style={styles.logsList}>
                {groupedLogs[dateGroup].map((log) => (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logIconWrapper}>
                      <Feather name="message-square" size={18} color="#3a7bd5" />
                    </View>
                    <View style={styles.logContent}>
                      <Text style={styles.logMessage}>"{log.message}"</Text>
                      <View style={styles.logMeta}>
                        <Feather name="clock" size={12} color="#888" />
                        <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <AuthLayout hideCircles={true}>
      <SafeAreaView style={styles.container}>
        <NotificationIndicator
          visible={showNotificationIndicator}
        title={currentNotification?.title}
        message={currentNotification?.message}
        onPress={() => {
          if (currentNotification?.id) markAsRead(currentNotification.id);
          setShowNotificationIndicator(false);
        }}
        onClose={() => setShowNotificationIndicator(false)}
      />

      <View style={[styles.mainLayout, isLargeScreen && styles.mainLayoutLarge]}>
        
        {/* Left Panel: Status & History */}
        <View style={[styles.leftPanel, isLargeScreen && styles.leftPanelLarge]}>
          <DeviceStatusCard 
            deviceName={childName}
            isActive={deviceActive}
            batteryLevel={batteryLevel}
          />
          {renderHistoryPanel()}
        </View>

        {/* Right Panel: Menu Grid */}
        <View style={[styles.rightPanel, isLargeScreen && styles.rightPanelLarge]}>
          <ScrollView contentContainerStyle={styles.rightScrollContent}>
            <MenuGrid menus={menuItems} />
          </ScrollView>
        </View>

      </View>
    </SafeAreaView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  mainLayoutLarge: {
    flexDirection: 'row', // Split screen on large devices
  },
  leftPanel: {
    padding: 16,
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  leftPanelLarge: {
    flex: 1, // Takes 1 part of screen
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#eee',
    height: '100%',
  },
  rightPanel: {
    flex: 1,
  },
  rightPanelLarge: {
    flex: 1.2, // Slightly wider for the grid on large screens
    height: '100%',
  },
  rightScrollContent: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'center', // Centers grid vertically on large screens
  },
  historyContainer: {
    flex: 1,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  historyScroll: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyText: {
    marginTop: 12,
    color: '#888',
    fontSize: 15,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 12,
    marginLeft: 4,
  },
  logsList: {
    gap: 12,
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: '#FDF6E3',
    borderRadius: 12,
    padding: 12,
  },
  logIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5D6B5',
  },
  logContent: {
    flex: 1,
    justifyContent: 'center',
  },
  logMessage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logTime: {
    fontSize: 12,
    color: '#888',
  },
});
