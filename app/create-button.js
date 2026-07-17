import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { getRecord, updateRecord } from '../services/database.service';
import { getParentChildConnections, createButton, updateButton } from '../services/parent.service';
import AuthLayout from '../components/AuthLayout';

export default function CreateButton() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [buttonText, setButtonText] = useState('');
  const [image, setImage] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [connectedChildren, setConnectedChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(params.editMode === 'true');
  const [editingButtonId, setEditingButtonId] = useState(params.buttonId);

  useEffect(() => {
    loadConnectedChildren();
  }, []);

  useEffect(() => {
    if (editMode && params.buttonId && connectedChildren.length > 0) {
      loadExistingButtonData();
    }
  }, [connectedChildren, editMode, params.buttonId]);

  const loadExistingButtonData = async () => {
    try {
      if (params.text) {
        setButtonText(params.text);
      }
      
      const childConnection = connectedChildren.find(child => 
        child.childEmail === params.childEmail
      );
      if (childConnection) {
        setSelectedChild(childConnection);
      }
      
      const result = await getRecord(`parent-buttons/${params.buttonId}`);
      if (result.success && result.data) {
        const buttonData = result.data;
        if (buttonData.imageBase64) {
          setImage({ uri: buttonData.imageBase64 });
        }
        if (buttonData.audioBase64) {
          setAudioUri(buttonData.audioBase64);
        }
      }
    } catch (error) {
      console.error('Error loading existing button data:', error);
    }
  };

  const loadConnectedChildren = async () => {
    try {
      const result = await getParentChildConnections(currentUser.email);
      if (result.success) {
        const activeChildren = result.data.filter(conn => conn.status === 'active');
        setConnectedChildren(activeChildren);
      }
    } catch (error) {
      console.error('Error loading connected children:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission to record audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const playAudio = async () => {
    if (!audioUri) return;

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      await sound.playAsync();
    } catch (err) {
      console.error('Failed to play audio', err);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const convertToBase64 = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const saveButton = async () => {
    if (!buttonText.trim()) {
      Alert.alert('Error', 'Please enter button text');
      return;
    }

    if (!selectedChild) {
      Alert.alert('Error', 'Please select a child');
      return;
    }

    if (!image) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    if (!audioUri) {
      Alert.alert('Error', 'Please record audio');
      return;
    }

    setLoading(true);

    try {
      const imageBase64 = await convertToBase64(image.uri);
      const audioBase64 = await convertToBase64(audioUri);

      const buttonData = {
        text: buttonText,
        imageBase64,
        audioBase64,
        parentId: currentUser.uid,
        parentEmail: currentUser.email,
        childId: selectedChild.childId,
        childEmail: selectedChild.childEmail,
        childName: selectedChild.childName,
        createdAt: new Date().toISOString()
      };

      if (editMode && editingButtonId) {
        const result = await updateButton(editingButtonId, buttonData);
        if (result.success) {
          Alert.alert('Success', 'Button updated successfully!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          Alert.alert('Error', 'Failed to update button');
        }
      } else {
        const result = await createButton(buttonData);
        if (result.success) {
          Alert.alert('Success', 'Button created successfully!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          Alert.alert('Error', 'Failed to create button');
        }
      }

    } catch (error) {
      console.error('Error saving button:', error);
      Alert.alert('Error', 'Failed to save button');
    } finally {
      setLoading(false);
    }
  };

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
              <Text style={styles.title}>
                {editMode ? 'Edit Word' : 'Add Word'}
              </Text>
            </View>
          </View>

          <View style={styles.cardContainer}>
            
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Feather name="user" size={18} color="#3a7bd5" />
                <Text style={styles.label}>Select Child</Text>
              </View>
              {connectedChildren.length === 0 ? (
                <View style={styles.noChildrenContainer}>
                  <Text style={styles.noChildrenText}>No children connected</Text>
                  <Text style={styles.noChildrenSubtext}>
                    Go to "Manage Children" to connect with a child first
                  </Text>
                </View>
              ) : (
                <View style={styles.childrenContainer}>
                  {connectedChildren.map((child) => (
                    <TouchableOpacity
                      key={child.id}
                      style={[
                        styles.childOption,
                        selectedChild?.id === child.id && styles.childOptionSelected
                      ]}
                      onPress={() => setSelectedChild(child)}
                    >
                      <View style={styles.childOptionContent}>
                        <Text style={[
                          styles.childOptionText,
                          selectedChild?.id === child.id && styles.childOptionTextSelected
                        ]}>
                          {child.childName}
                        </Text>
                        <Text style={[
                          styles.childOptionEmail,
                          selectedChild?.id === child.id && styles.childOptionEmailSelected
                        ]}>
                          {child.childEmail}
                        </Text>
                      </View>
                      {selectedChild?.id === child.id && (
                        <Feather name="check-circle" size={20} color="#3a7bd5" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Feather name="type" size={18} color="#3a7bd5" />
                <Text style={styles.label}>Word Text</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="E.g. Apple, Drink, Play..."
                placeholderTextColor="#999"
                value={buttonText}
                onChangeText={setButtonText}
                maxLength={50}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Feather name="image" size={18} color="#3a7bd5" />
                <Text style={styles.label}>Image</Text>
              </View>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage} activeOpacity={0.8}>
                {image ? (
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Feather name="camera" size={32} color="#aaa" />
                    <Text style={styles.imageButtonText}>Tap to upload photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Feather name="mic" size={18} color="#3a7bd5" />
                <Text style={styles.label}>Audio Recording</Text>
              </View>
              <View style={styles.audioContainer}>
                <TouchableOpacity
                  style={[styles.audioButton, isRecording && styles.recordingButton]}
                  onPress={isRecording ? stopRecording : startRecording}
                  activeOpacity={0.8}
                >
                  <Feather 
                    name={isRecording ? "square" : "mic"} 
                    size={20} 
                    color={isRecording ? "#fff" : "#333"} 
                  />
                  <Text style={[
                    styles.audioButtonText,
                    isRecording && { color: '#fff' }
                  ]}>
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </Text>
                </TouchableOpacity>
                
                {audioUri && (
                  <TouchableOpacity 
                    style={styles.playButton} 
                    onPress={playAudio}
                    activeOpacity={0.8}
                  >
                    <Feather name="play" size={20} color="#fff" />
                    <Text style={styles.playButtonText}>Play</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={saveButton}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Update Word' : 'Save Word'}
                </Text>
              </>
            )}
          </TouchableOpacity>

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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  cardContainer: {
    backgroundColor: '#FDF6E3',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  formSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5D6B5',
    marginVertical: 20,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5D6B5',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  imageButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#E5D6B5',
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 160,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imageButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  audioContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  audioButton: {
    flex: 2,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5D6B5',
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordingButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  audioButtonText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 14,
  },
  playButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
  },
  playButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#3a7bd5',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#3a7bd5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  noChildrenContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D6B5',
    alignItems: 'center',
  },
  noChildrenText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  noChildrenSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  childrenContainer: {
    gap: 10,
  },
  childOption: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5D6B5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  childOptionSelected: {
    backgroundColor: '#e6f0fa',
    borderColor: '#3a7bd5',
  },
  childOptionContent: {
    flex: 1,
  },
  childOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  childOptionTextSelected: {
    color: '#3a7bd5',
  },
  childOptionEmail: {
    fontSize: 13,
    color: '#666',
  },
  childOptionEmailSelected: {
    color: '#3a7bd5',
  },
});
