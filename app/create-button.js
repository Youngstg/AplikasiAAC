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
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion, getDocs, query, where } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

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
      
      // Find the child by email
      const childConnection = connectedChildren.find(child => 
        child.childEmail === params.childEmail
      );
      if (childConnection) {
        setSelectedChild(childConnection);
      }
      
      // Load the actual button data from Firestore to get image and audio
      const buttonDoc = await getDoc(doc(db, 'parent-buttons', params.buttonId));
      if (buttonDoc.exists()) {
        const buttonData = buttonDoc.data();
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
      const connectionsQuery = query(
        collection(db, 'parent-child-connections'),
        where('parentId', '==', currentUser.uid),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(connectionsQuery);
      const children = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConnectedChildren(children);
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
      // Convert image to base64
      const imageBase64 = await convertToBase64(image.uri);

      // Convert audio to base64
      const audioBase64 = await convertToBase64(audioUri);

      // Create button data
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

      // Save to parent-buttons collection
      if (editMode && editingButtonId) {
        // Update existing button
        await updateDoc(doc(db, 'parent-buttons', editingButtonId), buttonData);
        Alert.alert('Success', 'Button updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        // Create new button
        await addDoc(collection(db, 'parent-buttons'), buttonData);
        Alert.alert('Success', 'Button created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }

    } catch (error) {
      console.error('Error saving button:', error);
      Alert.alert('Error', 'Failed to save button');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {editMode ? 'Edit Communication Button' : 'Create Communication Button'}
          </Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Select Child:</Text>
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
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Button Text:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter button text"
            value={buttonText}
            onChangeText={setButtonText}
            maxLength={50}
          />

          <Text style={styles.label}>Button Image:</Text>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.imageButtonText}>Select Image</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Audio Recording:</Text>
          <View style={styles.audioContainer}>
            <TouchableOpacity
              style={[styles.audioButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.audioButtonText}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </TouchableOpacity>
            
            {audioUri && (
              <TouchableOpacity style={styles.playButton} onPress={playAudio}>
                <Text style={styles.playButtonText}>Play Audio</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={saveButton}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Button'}
            </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    backgroundColor: '#764ba2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  imageButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  imageButtonText: {
    color: '#666',
    fontSize: 16,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  audioContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  audioButton: {
    flex: 1,
    backgroundColor: '#764ba2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  audioButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  playButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#764ba2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  noChildrenContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  noChildrenText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  noChildrenSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  childrenContainer: {
    marginBottom: 20,
  },
  childOption: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  childOptionSelected: {
    backgroundColor: '#efe8fb',
    borderColor: '#764ba2',
  },
  childOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  childOptionTextSelected: {
    color: '#764ba2',
  },
  childOptionEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  childOptionEmailSelected: {
    color: '#764ba2',
  },
});
