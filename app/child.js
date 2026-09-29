import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  Image,
  TextInput
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Audio } from 'expo-av';
import * as Battery from 'expo-battery';
import { getCustomButtons, updateChildStatus } from '../services/child.service';
import { sendNotificationToParent } from '../services/notification.service';
import { logCommunication } from '../services/history.service';
import { saveLastMessage } from '../services/storage.service';
import OfflineIndicator from '../components/OfflineIndicator';

export default function ChildDashboard() {
  const { logout, currentUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedMessage, setSelectedMessage] = useState('');
  const [screenData, setScreenData] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });
  const [gridColumns, setGridColumns] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const loadGridSettings = async () => {
        try {
          const savedColumns = await AsyncStorage.getItem('childGridColumns');
          if (savedColumns) {
            setGridColumns(parseInt(savedColumns, 10));
          }
        } catch (e) {
          console.error('Failed to load grid settings', e);
        }
      };
      loadGridSettings();
    }, [])
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastBatteryLevel, setLastBatteryLevel] = useState(0);
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
    updateBatteryInfo();
  }, [currentUser]);

  const updateBatteryInfo = async () => {
    if (!currentUser?.uid) return;

    const updateBattery = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        const state = await Battery.getBatteryStateAsync();
        const batteryPercent = Math.round(level * 100);

        // Only update if battery changed by 5% or more
        if (Math.abs(lastBatteryLevel - batteryPercent) >= 5 || lastBatteryLevel === 0) {
          await updateChildStatus(currentUser.uid, {
            childId: currentUser.uid,
            childEmail: currentUser.email,
            batteryLevel: batteryPercent,
            batteryState: state,
            status: 'active',
            lastActive: Date.now()
          });
          setLastBatteryLevel(batteryPercent);
        }
      } catch (error) {
        console.error('Error updating battery info:', error);
      }
    };

    // Initial update
    await updateBattery();

    // Update every 5 minutes instead of 30 seconds for battery saving
    const interval = setInterval(updateBattery, 300000);

    return () => clearInterval(interval);
  };

  const loadCustomButtons = async () => {
    if (!currentUser?.email) return;

    setLoading(true);
    setError(null);
    try {
      const result = await getCustomButtons(currentUser.email);
      if (result.success) {
        setCustomButtons(result.data);
      } else {
        setError(result.error || 'Failed to load custom buttons');
        Alert.alert(
          'Unable to Load Buttons',
          'Please check your connection and try again.',
          [
            { text: 'Retry', onPress: loadCustomButtons },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Error loading custom buttons:', error);
      setError(error.message);
    } finally {
      setLoading(false);
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

  const handleCustomButtonPress = useCallback(async (button) => {
    setSelectedMessage(button.text);

    // Add word to input text
    const newText = inputText ? `${inputText} ${button.text}` : button.text;
    setInputText(newText);

    // Add audio to queue if available
    if (button.audioBase64) {
      setAudioQueue(prev => [...prev, button.audioBase64]);
    }
  }, [inputText]);

  const sendNotification = useCallback(async (message) => {
    if (!currentUser?.email || !message.trim()) return;

    try {
      await sendNotificationToParent(
        currentUser.email,
        currentUser.uid,
        currentUser.displayName || currentUser.email,
        message
      );
      await logCommunication(
        currentUser.email,
        currentUser.uid,
        currentUser.displayName || currentUser.email,
        message
      );
    } catch (error) {
      console.error('Error sending notification or logging history:', error);
    }
  }, [currentUser]);

  const handlePlayAudio = useCallback(async () => {
    if (audioQueue.length === 0 && !inputText.trim()) {
      Alert.alert('No Content', 'Please add some words first');
      return;
    }

    // Save last message and audio queue for repeat functionality
    if (inputText.trim()) {
      await saveLastMessage(inputText, audioQueue);
    }

    // Send notification to parent with input text
    if (inputText.trim()) {
      await sendNotification(inputText);
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
  }, [audioQueue, inputText, currentUser, sendNotification]);

  // Memoize custom buttons for current user
  const filteredCustomButtons = useMemo(() => {
    return customButtons.filter(btn => btn.childEmail === currentUser?.email);
  }, [customButtons, currentUser?.email]);

  // Dynamic button styling based on orientation for grid layout
  const getButtonStyle = useMemo(() => {
    const isLandscape = screenData.width > screenData.height;
    // Use user-defined columns, or default to 6 for landscape and 3 for portrait
    const requestedColumns = gridColumns || (isLandscape ? 5 : 3);
    const padding = screenData.width < 700 ? 12 : 20;
    const gap = screenData.width < 700 ? 8 : 12;
    const scrollbarBuffer = Platform.OS === 'web' ? 24 : 0;
    const availableWidth = screenData.width - insets.left - insets.right - (padding * 2) - scrollbarBuffer;
    const minimumTileSize = screenData.width < 700 ? 88 : 104;
    const maximumColumns = Math.max(2, Math.floor((availableWidth + gap) / (minimumTileSize + gap)));
    const columns = Math.min(requestedColumns, maximumColumns);
    const buttonSize = Math.min(180, Math.floor((availableWidth - gap * (columns - 1)) / columns));

    return {
      width: buttonSize,
      height: buttonSize,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 10,
      elevation: 2,
      shadowColor: '#17324D',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#CFE8E6',
      position: 'relative',
    };
  }, [screenData, gridColumns, insets.left, insets.right]);


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.headerShell}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.eyebrow}>PAPAN KOMUNIKASI</Text>
            <Text style={styles.headerTitle}>Susun pesanmu</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/child-settings')}
            accessibilityRole="button"
            accessibilityLabel="Buka pengaturan papan komunikasi"
          >
            <Feather name="settings" size={21} color="#17324D" />
            <Text style={styles.settingsButtonText}>Pengaturan</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.topBar}>
          <View style={styles.sentenceContainer}>
            <TextInput
              style={styles.sentenceField}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ketuk gambar untuk menyusun pesan..."
              placeholderTextColor="#6B8192"
              multiline
              editable={false}
              accessibilityLabel="Pesan yang sedang disusun"
            />
          </View>
          <TouchableOpacity
            style={styles.playButtonTop}
            onPress={handlePlayAudio}
            accessibilityRole="button"
            accessibilityLabel="Ucapkan pesan"
            accessibilityHint="Memutar suara dan mengirim pesan kepada orang tua"
          >
            <Feather name="volume-2" size={23} color="#FFFFFF" />
            <Text style={styles.playButtonTopText}>Ucapkan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setInputText('');
              setAudioQueue([]);
            }}
            accessibilityRole="button"
            accessibilityLabel="Hapus seluruh pesan"
          >
            <Feather name="trash-2" size={20} color="#C84C4C" />
          </TouchableOpacity>
        </View>
      </View>

      <OfflineIndicator />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.communicationContainer}>
          {customButtons.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}><Feather name="message-circle" size={28} color="#176B87" /></View>
              <Text style={styles.emptyTitle}>Belum ada kosakata</Text>
              <Text style={styles.emptyText}>Minta orang tua menambahkan gambar dan kata untuk mulai berkomunikasi.</Text>
            </View>
          ) : (
          <View style={styles.buttonsGrid}>
            {customButtons.map((button) => (
              <TouchableOpacity
                key={button.id}
                style={getButtonStyle}
                onPress={() => handleCustomButtonPress(button)}
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityLabel={`Tambahkan kata ${button.text}`}
              >
                {button.imageBase64 && (
                  <Image source={{ uri: button.imageBase64 }} style={styles.buttonImage} />
                )}
                <Text style={styles.communicationText}>{button.text}</Text>
              </TouchableOpacity>
            ))}
            
          </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF8F7',
  },
  headerShell: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#D9ECEA',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    color: '#176B87',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? 'Trebuchet MS' : undefined,
  },
  headerTitle: {
    color: '#17324D',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'Trebuchet MS' : undefined,
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
    flex: 1,
    width: '100%',
    maxWidth: 1440,
    alignSelf: 'center',
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
    justifyContent: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  buttonImage: {
    width: '72%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  communicationText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: '#17324D',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Trebuchet MS' : undefined,
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
    backgroundColor: '#EDF8F7',
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CFE8E6',
    gap: 8,
  },
  sentenceContainer: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
  },
  sentenceField: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    lineHeight: 24,
    minHeight: 54,
    maxHeight: 96,
    color: '#17324D',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Trebuchet MS' : undefined,
  },
  playButtonTop: {
    minHeight: 54,
    minWidth: 112,
    backgroundColor: '#176B87',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonTopText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'Trebuchet MS' : undefined,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
  },
  clearButton: {
    backgroundColor: '#FFF1F0',
    width: 54,
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2D0CD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  settingsButton: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#E0F4F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#17324D',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Trebuchet MS' : undefined,
  },
  emptyState: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CFE8E6',
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F4F2',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#17324D',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    color: '#5C7285',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 420,
  },
});