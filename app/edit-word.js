import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getParentButtons, deleteButton } from '../services/parent.service';

export default function EditWord() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [customButtons, setCustomButtons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomButtons();
  }, [currentUser]);

  const loadCustomButtons = async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      console.log('Loading buttons for parent email:', currentUser.email);

      const result = await getParentButtons(currentUser.email);
      if (result.success) {
        console.log('Found buttons:', result.data.length);
        console.log('All buttons:', result.data);
        setCustomButtons(result.data);
      }
    } catch (error) {
      console.error('Error loading custom buttons:', error);
      Alert.alert('Error', 'Failed to load buttons');
    } finally {
      setLoading(false);
    }
  };

  const handleEditButton = (button) => {
    // Navigate to create-button page with edit data
    router.push({
      pathname: '/create-button',
      params: { 
        editMode: 'true',
        buttonId: button.id,
        text: button.text,
        childEmail: button.childEmail,
        childName: button.childName
      }
    });
  };

  const handleDeleteButton = (button) => {
    Alert.alert(
      'Delete Button',
      `Are you sure you want to delete "${button.text}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('=== DELETE ATTEMPT ===');
              console.log('Deleting button with ID:', button.id);
              console.log('Button ID type:', typeof button.id);
              console.log('Button ID length:', button.id?.length);
              console.log('Full button object:', JSON.stringify(button, null, 2));
              
              if (!button.id || button.id.trim() === '') {
                throw new Error('Button ID is missing or empty');
              }
              
              // Create document reference
              const docRef = doc(db, 'parent-buttons', button.id);
              console.log('Document reference created:', docRef.path);

              // Perform the delete
              console.log('Attempting to delete button...');
              const result = await deleteButton(button.id);

              if (result.success) {
                console.log('Delete operation completed successfully');
                Alert.alert('Success', 'Button deleted successfully');
                loadCustomButtons(); // Refresh the list
              } else {
                console.error('Delete failed:', result.error);
                Alert.alert('Error', `Failed to delete button: ${result.error}`);
              }

            } catch (error) {
              console.error('=== DELETE ERROR ===');
              console.error('Error deleting button:', error);
              console.error('Button ID that failed:', button.id);

              Alert.alert('Error', `Failed to delete button: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading buttons...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Words</Text>
        </View>

        {customButtons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No buttons created yet</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/create-button')}
            >
              <Text style={styles.createButtonText}>Create First Button</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonsContainer}>
            {customButtons.map((button) => (
              <View key={button.id} style={styles.buttonCard}>
                <View style={styles.buttonInfo}>
                  {button.imageBase64 && (
                    <Image source={{ uri: button.imageBase64 }} style={styles.buttonImage} />
                  )}
                  <View style={styles.buttonDetails}>
                    <Text style={styles.buttonText}>{button.text}</Text>
                    <Text style={styles.buttonChild}>For: {button.childName}</Text>
                  </View>
                </View>
                <View style={styles.buttonActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditButton(button)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteButton(button)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
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
    marginBottom: 30,
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 15,
  },
  backButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#764ba2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonsContainer: {
    gap: 15,
  },
  buttonCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buttonImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  buttonDetails: {
    flex: 1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  buttonChild: {
    fontSize: 14,
    color: '#666',
  },
  buttonActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#a8f0c0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#f0a8a8',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
