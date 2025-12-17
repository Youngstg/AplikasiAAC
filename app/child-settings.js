import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { getFavorites } from '../services/child.service';
import { getChildConnections } from '../services/parent.service';
import { getLastMessage } from '../services/storage.service';

export default function ChildSettings() {
  const { logout, currentUser, getUserData } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [parentPhone, setParentPhone] = useState('');
  const [lastMessage, setLastMessage] = useState('');
  const [lastAudioQueue, setLastAudioQueue] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (currentUser?.uid) {
      getUserData(currentUser.uid).then((profile) => {
        setUserData(profile);
      });
    }
    loadParentInfo();
    loadFavorites();
    loadLastMessage();
  }, [currentUser]);

  const loadLastMessage = async () => {
    try {
      const result = await getLastMessage();
      if (result.success) {
        setLastMessage(result.data.message);
        setLastAudioQueue(result.data.audioQueue);
      }
    } catch (error) {
      console.error('Error loading last message:', error);
    }
  };

  const loadParentInfo = async () => {
    if (!currentUser?.email) return;
    try {
      const result = await getChildConnections(currentUser.email);
      if (result.success && result.data.length > 0) {
        const activeConnection = result.data.find(conn => conn.status === 'active');
        if (activeConnection) {
          setParentPhone(activeConnection.parentPhone || '');
        }
      }
    } catch (error) {
      console.error('Error loading parent info:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const result = await getFavorites(currentUser.email);
      if (result.success) {
        setFavorites(result.data);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
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

  const handleGoBack = () => {
    router.back();
  };

  const handleCallParent = async () => {
    if (!parentPhone) {
      Alert.alert('No Parent Phone', 'Parent phone number not found. Please contact your parent.');
      return;
    }
    
    try {
      const phoneUrl = `tel:${parentPhone}`;
      await Linking.openURL(phoneUrl);
    } catch (error) {
      Alert.alert('Error', 'Could not initiate call');
    }
  };

  const handleRepeatLast = async () => {
    if (!lastMessage) {
      Alert.alert('No Last Message', 'No previous message to repeat. Use buttons first.');
      return;
    }

    // Play audio if available
    if (lastAudioQueue && lastAudioQueue.length > 0) {
      try {
        for (const audioBase64 of lastAudioQueue) {
          const { sound } = await Audio.Sound.createAsync({ uri: audioBase64 });
          await sound.playAsync();

          // Wait for audio to finish before playing next
          await new Promise((resolve) => {
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) {
                sound.unloadAsync();
                resolve();
              }
            });
          });
        }
      } catch (error) {
        console.error('Error playing audio:', error);
        Alert.alert('Error', 'Failed to play audio. Showing text instead: ' + lastMessage);
      }
    } else {
      // If no audio available, show text message
      Alert.alert('Repeated Message', lastMessage);
    }
  };

  const handleViewFavorites = () => {
    if (favorites.length === 0) {
      Alert.alert('No Favorites', 'You have no favorite messages yet.');
      return;
    }
    
    const favoritesList = favorites.map(f => f.message).join(', ');
    Alert.alert('Your Favorites', favoritesList);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={22} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.userContainer}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.usernameText}>{userData?.name || currentUser?.email}</Text>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleCallParent}
              activeOpacity={0.85}
            >
              <View style={styles.quickActionIcon}>
                <Feather name="phone-call" size={18} color="#3a7bd5" />
              </View>
              <Text style={styles.quickActionText}>Call Parent</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleRepeatLast}
              activeOpacity={0.85}
            >
              <View style={styles.quickActionIcon}>
                <Feather name="repeat" size={18} color="#3a7bd5" />
              </View>
              <Text style={styles.quickActionText}>Repeat Last</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleViewFavorites}
              activeOpacity={0.85}
            >
              <View style={styles.quickActionIcon}>
                <Feather name="star" size={18} color="#3a7bd5" />
              </View>
              <Text style={styles.quickActionText}>Favorites</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/connect-parent')}
              activeOpacity={0.85}
            >
              <View style={styles.quickActionIcon}>
                <Feather name="link" size={18} color="#3a7bd5" />
              </View>
              <Text style={styles.quickActionText}>Connect Parent</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  userContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 6,
  },
  usernameText: {
    fontSize: 16,
    color: '#666666',
  },
  quickActionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  quickActionButton: {
    width: '47%',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#f5f6ff',
    borderWidth: 1,
    borderColor: '#dee3ff',
    gap: 10,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  logoutContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#ff5b5b',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 24,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
