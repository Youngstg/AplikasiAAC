import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
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
  const isLargeScreen = width >= 768;
  
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showNotificationIndicator, setShowNotificationIndicator] = useState(false);
  
  // Device Status State
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [childId, setChildId] = useState(null);
  const [childName, setChildName] = useState('Tablet anak');
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
            setChildName(activeChild.childName || 'Tablet anak');
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
                { text: 'Tandai sudah dibaca', onPress: () => markAsRead(latestNotification.id) },
                { text: 'Tutup' }
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
      const confirmLogout = window.confirm('Yakin ingin keluar dari akun?');
      if (confirmLogout) {
        try {
          await logout();
          router.replace('/login');
        } catch (error) {
          alert('Gagal keluar. Silakan coba lagi.');
        }
      }
    } else {
      Alert.alert('Keluar akun', 'Yakin ingin keluar dari akun?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: async () => {
            try { await logout(); router.replace('/login'); } catch (error) { Alert.alert('Gagal', 'Tidak dapat keluar. Silakan coba lagi.'); }
          }
        }
      ]);
    }
  };

  const menuItems = [
    {
      title: 'Kelola anak',
      iconName: 'users',
      backgroundColor: '#DDF3F1',
      items: ['Undang', 'Setujui', 'Hubungkan'],
      onPress: () => router.push('/manage-children')
    },
    {
      title: 'Tambah kata',
      iconName: 'plus-circle',
      backgroundColor: '#D9EEF5',
      items: ['Kata', 'Gambar', 'Suara'],
      onPress: () => router.push('/create-button')
    },
    {
      title: 'Ubah kata',
      iconName: 'edit-3',
      backgroundColor: '#E4F3E9',
      items: ['Perbarui', 'Kata tersimpan'],
      onPress: () => router.push('/edit-word')
    },
    {
      title: 'Keluar akun',
      iconName: 'log-out',
      backgroundColor: '#FFF0D0',
      items: ['Akhiri sesi', 'Akun aman'],
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
        dateString = 'Hari ini';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateString = 'Kemarin';
      } else {
        dateString = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
      }
      if (!groups[dateString]) groups[dateString] = [];
      groups[dateString].push(log);
    });
    return groups;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const groupedLogs = groupLogsByDate(historyLogs);

  const renderHistoryPanel = () => (
    <View style={styles.historyContainer}>
      <View style={styles.sectionHeadingRow}>
        <View>
          <Text style={styles.sectionEyebrow}>AKTIVITAS AAC</Text>
          <Text style={styles.historyTitle}>Riwayat terbaru</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{historyLogs.length}</Text>
        </View>
      </View>
      {loadingHistory ? (
        <ActivityIndicator size="large" color="#3a7bd5" style={{ marginTop: 40 }} />
      ) : historyLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="clock" size={25} color="#176B87" />
          </View>
          <Text style={styles.emptyTitle}>Belum ada aktivitas</Text>
          <Text style={styles.emptyText}>Pesan yang digunakan anak akan tampil di sini.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.historyScroll}
          contentContainerStyle={styles.historyScrollContent}
          scrollEnabled={isLargeScreen}
          nestedScrollEnabled={isLargeScreen}
          showsVerticalScrollIndicator={false}
        >
          {Object.keys(groupedLogs).map((dateGroup, index) => (
            <View key={index} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{dateGroup}</Text>
              <View style={styles.logsList}>
                {groupedLogs[dateGroup].map((log) => (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logIconWrapper}>
                      <Feather name="message-square" size={18} color="#176B87" />
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

  const renderPageHeader = () => (
    <View style={styles.pageHeader}>
      <View style={styles.brandMark} accessibilityElementsHidden>
        <Feather name="message-circle" size={22} color="#FFFFFF" />
      </View>
      <View style={styles.pageHeaderText}>
        <Text style={styles.welcomeLabel}>RUANG PENDAMPING</Text>
        <Text style={styles.pageTitle}>Halo, Orang Tua</Text>
        <Text style={styles.pageSubtitle}>Pantau perangkat dan siapkan kosakata anak dengan mudah.</Text>
      </View>
    </View>
  );

  const renderMenuPanel = () => (
    <View style={styles.menuPanelContent}>
      <View style={styles.menuHeading}>
        <Text style={styles.sectionEyebrow}>AKSES CEPAT</Text>
        <Text style={styles.menuTitle}>Apa yang ingin Anda lakukan?</Text>
        <Text style={styles.menuSubtitle}>Kelola kebutuhan komunikasi anak dari satu tempat.</Text>
      </View>
      <MenuGrid menus={menuItems} />
    </View>
  );

  return (
    <AuthLayout hideCircles={true}>
      <View style={styles.container}>
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

        {isLargeScreen ? (
          <View style={styles.tabletLayout}>
            <View style={styles.leftPanel}>
              {renderPageHeader()}
              <DeviceStatusCard deviceName={childName} isActive={deviceActive} batteryLevel={batteryLevel} />
              {renderHistoryPanel()}
            </View>
            <View style={styles.rightPanel}>
              <ScrollView
                contentContainerStyle={styles.rightScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {renderMenuPanel()}
              </ScrollView>
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.mobileScroll}
            contentContainerStyle={styles.mobileContent}
            showsVerticalScrollIndicator={false}
          >
            {renderPageHeader()}
            <DeviceStatusCard deviceName={childName} isActive={deviceActive} batteryLevel={batteryLevel} />
            {renderMenuPanel()}
            {renderHistoryPanel()}
          </ScrollView>
        )}
      </View>
    </AuthLayout>
  );
}

const bodyFont = Platform.OS === 'ios' ? 'Trebuchet MS' : 'sans-serif';
const displayFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDF8F7' },
  tabletLayout: { flex: 1, flexDirection: 'row', padding: 20, gap: 20 },
  leftPanel: { flex: 0.9, minWidth: 330, maxWidth: 520 },
  rightPanel: { flex: 1.25, minWidth: 0, backgroundColor: '#FFFFFF', borderRadius: 28, overflow: 'hidden' },
  rightScrollContent: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  mobileScroll: { flex: 1 },
  mobileContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 32, gap: 18 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  brandMark: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#176B87', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  pageHeaderText: { flex: 1 },
  welcomeLabel: { color: '#176B87', fontFamily: bodyFont, fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 4 },
  pageTitle: { color: '#17324D', fontFamily: displayFont, fontSize: 29, lineHeight: 34, fontWeight: '700' },
  pageSubtitle: { color: '#557086', fontFamily: bodyFont, fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: 430 },
  menuPanelContent: { width: '100%' },
  menuHeading: { marginBottom: 20 },
  sectionEyebrow: { color: '#176B87', fontFamily: bodyFont, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  menuTitle: { color: '#17324D', fontFamily: displayFont, fontSize: 25, lineHeight: 31, fontWeight: '700' },
  menuSubtitle: { color: '#557086', fontFamily: bodyFont, fontSize: 13, lineHeight: 19, marginTop: 5 },
  historyContainer: {
    flex: 1,
    minHeight: 230,
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCEBEA',
    shadowColor: '#17324D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  historyTitle: { fontSize: 21, lineHeight: 26, fontWeight: '700', color: '#17324D', fontFamily: displayFont },
  countBadge: { minWidth: 32, height: 32, paddingHorizontal: 9, borderRadius: 16, backgroundColor: '#FFCF5C', alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { color: '#17324D', fontSize: 12, fontWeight: '800' },
  historyScroll: { flex: 1 },
  historyScrollContent: { paddingBottom: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, paddingHorizontal: 16 },
  emptyIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#EDF8F7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: '#17324D', fontFamily: bodyFont, fontSize: 15, fontWeight: '700' },
  emptyText: { marginTop: 5, color: '#557086', fontFamily: bodyFont, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  dateGroup: { marginBottom: 17 },
  dateHeader: { fontFamily: bodyFont, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: '#557086', marginBottom: 9, textTransform: 'uppercase' },
  logsList: { gap: 9 },
  logCard: { flexDirection: 'row', backgroundColor: '#EDF8F7', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#DCEBEA' },
  logIconWrapper: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  logContent: { flex: 1, justifyContent: 'center' },
  logMessage: { fontFamily: bodyFont, fontSize: 14, lineHeight: 19, fontWeight: '700', color: '#17324D', marginBottom: 5 },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logTime: { fontFamily: bodyFont, fontSize: 11, color: '#557086' },
});
