import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { subscribeToHistory } from '../services/history.service';
import AuthLayout from '../components/AuthLayout';

export default function CommunicationHistory() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    const unsubscribe = subscribeToHistory(currentUser.uid, (logs) => {
      // Sort by timestamp descending (newest first)
      const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);
      setHistoryLogs(sortedLogs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Group logs by date (Today, Yesterday, Date)
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
      
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(log);
    });
    
    return groups;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const groupedLogs = groupLogsByDate(historyLogs);

  if (loading) {
    return (
      <AuthLayout>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3a7bd5" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        </SafeAreaView>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Feather name="arrow-left" size={22} color="#333333" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Communication History</Text>
            </View>
          </View>

          {historyLogs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <Feather name="clock" size={48} color="#ccc" />
              </View>
              <Text style={styles.emptyTitle}>No history yet</Text>
              <Text style={styles.emptyText}>When your child presses a button, the history will appear here.</Text>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {Object.keys(groupedLogs).map((dateGroup, index) => (
                <View key={index} style={styles.dateGroup}>
                  <Text style={styles.dateHeader}>{dateGroup}</Text>
                  
                  <View style={styles.logsList}>
                    {groupedLogs[dateGroup].map((log) => (
                      <View key={log.id} style={styles.logCard}>
                        <View style={styles.logIconWrapper}>
                          <Feather name="message-square" size={20} color="#3a7bd5" />
                        </View>
                        <View style={styles.logContent}>
                          <Text style={styles.logMessage}>"{log.message}"</Text>
                          <View style={styles.logMeta}>
                            <Feather name="user" size={12} color="#888" />
                            <Text style={styles.logChildName}>{log.childName || log.childEmail}</Text>
                            <Text style={styles.logDot}>•</Text>
                            <Feather name="clock" size={12} color="#888" />
                            <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  emptyContainer: {
    backgroundColor: '#FDF6E3',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  timelineContainer: {
    gap: 24,
  },
  dateGroup: {
    marginBottom: 8,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    marginLeft: 8,
  },
  logsList: {
    gap: 12,
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: '#FDF6E3',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  logIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5D6B5',
  },
  logContent: {
    flex: 1,
    justifyContent: 'center',
  },
  logMessage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logChildName: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  logDot: {
    fontSize: 13,
    color: '#888',
    marginHorizontal: 4,
  },
  logTime: {
    fontSize: 13,
    color: '#888',
  },
});
