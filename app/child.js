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
  Image,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import * as ScreenOrientation from 'expo-screen-orientation';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function ChildDashboard() {
  const { logout, currentUser } = useAuth();
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState('');
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [customButtons, setCustomButtons] = useState([]);
  const [inputText, setInputText] = useState('');
  const [audioQueue, setAudioQueue] = useState([]);

  useEffect(() => {
    // Set landscape orientation for all platforms
    const setOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    
    setOrientation();

    // Listen to orientation changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    // Cleanup: reset orientation when leaving this screen
    return () => {
      ScreenOrientation.unlockAsync();
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
    
    // Add word to input text
    const newText = inputText ? `${inputText} ${button.text}` : button.text;
    setInputText(newText);
    
    // Add audio to queue if available
    if (button.audioBase64) {
      setAudioQueue(prev => [...prev, button.audioBase64]);
    }
  };

  const sendNotificationToParent = async (message) => {
    if (!currentUser?.email || !message.trim()) return;

    try {
      // Get parent info from parent-child connections
      const connectionsQuery = query(
        collection(db, 'parent-child-connections'),
        where('childEmail', '==', currentUser.email),
        where('status', '==', 'active')
      );
      
      const connectionsSnapshot = await getDocs(connectionsQuery);
      
      if (connectionsSnapshot.empty) {
        console.log('No parent connection found');
        return;
      }

      // Send notification to each connected parent
      for (const doc of connectionsSnapshot.docs) {
        const connection = doc.data();
        
        await addDoc(collection(db, 'notifications'), {
          fromId: currentUser.uid,
          fromEmail: currentUser.email,
          fromName: currentUser.displayName || currentUser.email,
          toId: connection.parentId,
          toEmail: connection.parentEmail,
          toName: connection.parentName,
          message: message,
          timestamp: serverTimestamp(),
          read: false,
          type: 'button_pressed'
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handlePlayAudio = async () => {
    if (audioQueue.length === 0 && !inputText.trim()) {
      Alert.alert('No Content', 'Please add some words first');
      return;
    }

    // Send notification to parent with input text
    if (inputText.trim()) {
      await sendNotificationToParent(inputText);
    }

    // Play audio if available
    if (audioQueue.length > 0) {
      try {
        for (const audioBase64 of audioQueue) {
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
        Alert.alert('Error', 'Failed to play audio');
      }
    }
  };

  // Dynamic button styling based on orientation for grid layout
  const getButtonStyle = (screen) => {
    const isLandscape = screen.width > screen.height;
    const columns = isLandscape ? 6 : 3;  // 6 columns in landscape, 3 in portrait
    const padding = 20;
    const gap = 10;
    const buttonSize = (screen.width - padding * 2 - gap * (columns - 1)) / columns;
    
    return {
      width: buttonSize,
      height: buttonSize,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      backgroundColor: 'white',
      borderWidth: 2,
      borderColor: '#e0e0e0',
      position: 'relative',
    };
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <View style={styles.topBar}>
          <View style={styles.sentenceContainer}>
            <TextInput
              style={styles.sentenceField}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Tap buttons to add words..."
              multiline
              editable={false}
            />
          </View>
          <TouchableOpacity
            style={styles.playButtonTop}
            onPress={handlePlayAudio}
          >
            <Text style={styles.playButtonTopText}>▶</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setInputText('');
              setAudioQueue([]);
            }}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/child-settings')}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>


        <View style={styles.communicationContainer}>
          <View style={styles.buttonsGrid}>
            {customButtons.map((button) => (
              <TouchableOpacity
                key={button.id}
                style={getButtonStyle(screenData)}
                onPress={() => handleCustomButtonPress(button)}
              >
                {button.imageBase64 && (
                  <Image source={{ uri: button.imageBase64 }} style={styles.buttonImage} />
                )}
                <Text style={styles.communicationText}>{button.text}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Add empty placeholders to fill the grid */}
            {Array.from({ length: Math.max(0, (screenData.width > screenData.height ? 18 : 12) - customButtons.length) }).map((_, index) => (
              <View
                key={`placeholder-${index}`}
                style={[getButtonStyle(screenData), styles.emptyButton]}
              />
            ))}
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
    justifyContent: 'flex-start',
    gap: 10,
  },
  emoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  buttonImage: {
    width: 40,
    height: 40,
    borderRadius: 0,
    marginBottom: 8,
  },
  communicationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
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
  topBar: {
    backgroundColor: '#7FB3D3',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 15,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sentenceContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    marginRight: 10,
  },
  sentenceField: {
    padding: 12,
    fontSize: 16,
    minHeight: 50,
    maxHeight: 100,
    color: '#333',
  },
  playButtonTop: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
  },
  playButtonTopText: {
    fontSize: 20,
    color: 'black',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
});