import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import * as ScreenOrientation from 'expo-screen-orientation';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function ChildDashboard() {
  const { logout, currentUser } = useAuth();
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState('');
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [customButtons, setCustomButtons] = useState([]);

  useEffect(() => {
    // Set landscape orientation for Android
    const setOrientation = async () => {
      if (Platform.OS === 'android') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
    };
    
    setOrientation();

    // Listen to orientation changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    // Cleanup: reset orientation when leaving this screen
    return () => {
      if (Platform.OS === 'android') {
        ScreenOrientation.unlockAsync();
      }
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    loadCustomButtons();
  }, [currentUser]);

  const loadCustomButtons = async () => {
    if (!currentUser?.email) return;

    try {
      const buttonsQuery = query(
        collection(db, 'parent-buttons'),
        where('childEmail', '==', currentUser.email)
      );
      const querySnapshot = await getDocs(buttonsQuery);
      const buttons = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomButtons(buttons);
    } catch (error) {
      console.error('Error loading custom buttons:', error);
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

  const communicationButtons = [
    // { id: 1, text: 'I want water', emoji: '💧', color: '#4CAF50' },
    // { id: 2, text: 'I am hungry', emoji: '🍎', color: '#FF9800' },
    // { id: 3, text: 'I need help', emoji: '🆘', color: '#F44336' },
    // { id: 4, text: 'I want to play', emoji: '🎮', color: '#2196F3' },
    // { id: 5, text: 'I am tired', emoji: '😴', color: '#9C27B0' },
    // { id: 6, text: 'I am happy', emoji: '😊', color: '#FFEB3B' },
    // { id: 7, text: 'I am sad', emoji: '😢', color: '#607D8B' },
    // { id: 8, text: 'Thank you', emoji: '🙏', color: '#795548' },
  ];

  const handleCommunicationPress = (button) => {
    setSelectedMessage(button.text);
    Alert.alert(
      'Message Selected',
      `"${button.text}" has been selected. This would typically trigger text-to-speech or send a message.`,
      [{ text: 'OK' }]
    );
  };

  const handleCustomButtonPress = async (button) => {
    setSelectedMessage(button.text);
    
    try {
      if (button.audioBase64) {
        const { sound } = await Audio.Sound.createAsync({ uri: button.audioBase64 });
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  // Dynamic button styling based on orientation
  const getButtonStyle = (screen) => {
    const isLandscape = Platform.OS === 'android' && screen.width > screen.height;
    
    return {
      width: isLandscape 
        ? (screen.width - 60) / 4   // 4 columns in landscape
        : (screen.width - 50) / 2,  // 2 columns in portrait
      height: isLandscape 
        ? (screen.height - 200) / 2  // 2 rows in landscape  
        : (screen.width - 50) / 2,   // Square in portrait
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    };
  };

  const getQuickActionStyle = (screen) => {
    const isLandscape = Platform.OS === 'android' && screen.width > screen.height;
    
    return {
      width: isLandscape 
        ? (screen.width - 60) / 4   // 4 columns in landscape
        : (screen.width - 50) / 2,  // 2 columns in portrait
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 15,
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>My Communication</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Hello! 👋</Text>
          <Text style={styles.emailText}>{currentUser?.email}</Text>
          {selectedMessage ? (
            <View style={styles.selectedMessageContainer}>
              <Text style={styles.selectedMessageText}>Last selected: "{selectedMessage}"</Text>
            </View>
          ) : null}
        </View>

        {customButtons.length > 0 && (
          <View style={styles.communicationContainer}>
            <Text style={styles.sectionTitle}>Custom Buttons from Parent:</Text>
            <View style={styles.buttonsGrid}>
              {customButtons.map((button) => (
                <TouchableOpacity
                  key={button.id}
                  style={[
                    getButtonStyle(screenData), 
                    { backgroundColor: '#8E44AD' }
                  ]}
                  onPress={() => handleCustomButtonPress(button)}
                >
                  {button.imageBase64 && (
                    <Image source={{ uri: button.imageBase64 }} style={styles.buttonImage} />
                  )}
                  <Text style={styles.communicationText}>{button.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.communicationContainer}>
          <Text style={styles.sectionTitle}>Choose what you want to say:</Text>
          <View style={styles.buttonsGrid}>
            {communicationButtons.map((button) => (
              <TouchableOpacity
                key={button.id}
                style={[
                  getButtonStyle(screenData), 
                  { backgroundColor: button.color }
                ]}
                onPress={() => handleCommunicationPress(button)}
              >
                <Text style={styles.emoji}>{button.emoji}</Text>
                <Text style={styles.communicationText}>{button.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions:</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={getQuickActionStyle(screenData)}>
              <Text style={styles.quickActionEmoji}>📞</Text>
              <Text style={styles.quickActionText}>Call Parent</Text>
            </TouchableOpacity>
            <TouchableOpacity style={getQuickActionStyle(screenData)}>
              <Text style={styles.quickActionEmoji}>🔊</Text>
              <Text style={styles.quickActionText}>Repeat Last</Text>
            </TouchableOpacity>
            <TouchableOpacity style={getQuickActionStyle(screenData)}>
              <Text style={styles.quickActionEmoji}>❤️</Text>
              <Text style={styles.quickActionText}>Favorites</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={getQuickActionStyle(screenData)}
              onPress={() => router.push('/connect-parent')}
            >
              <Text style={styles.quickActionEmoji}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.quickActionText}>Connect Parent</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  welcomeContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    color: '#666',
  },
  selectedMessageContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  selectedMessageText: {
    fontSize: 14,
    color: '#1976d2',
    fontStyle: 'italic',
  },
  communicationContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  emoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  buttonImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  communicationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});