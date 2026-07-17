import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { getParentButtons, deleteButton } from '../services/parent.service';
import AuthLayout from '../components/AuthLayout';

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
              
              if (!button.id || button.id.trim() === '') {
                throw new Error('Button ID is missing or empty');
              }
              
              const result = await deleteButton(button.id);

              if (result.success) {
                console.log('Delete operation completed successfully');
                loadCustomButtons();
              } else {
                console.error('Delete failed:', result.error);
                Alert.alert('Error', `Failed to delete button: ${result.error}`);
              }

            } catch (error) {
              console.error('=== DELETE ERROR ===');
              console.error('Error deleting button:', error);
              Alert.alert('Error', `Failed to delete button: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <AuthLayout>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3a7bd5" />
            <Text style={styles.loadingText}>Loading words...</Text>
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
              <Text style={styles.title}>Edit Words</Text>
            </View>
          </View>

          {customButtons.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <Feather name="grid" size={48} color="#ccc" />
              </View>
              <Text style={styles.emptyTitle}>No words created yet</Text>
              <Text style={styles.emptyText}>Create your first communication button for your child.</Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => router.push('/create-button')}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create New Word</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttonsContainer}>
              {customButtons.map((button) => (
                <View key={button.id} style={styles.buttonCard}>
                  <View style={styles.buttonInfo}>
                    {button.imageBase64 ? (
                      <Image source={{ uri: button.imageBase64 }} style={styles.buttonImage} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Feather name="image" size={24} color="#aaa" />
                      </View>
                    )}
                    <View style={styles.buttonDetails}>
                      <Text style={styles.buttonText}>{button.text}</Text>
                      <View style={styles.childPill}>
                        <Feather name="user" size={12} color="#666" />
                        <Text style={styles.buttonChild}>{button.childName}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.buttonActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditButton(button)}
                      activeOpacity={0.8}
                    >
                      <Feather name="edit-2" size={16} color="#3a7bd5" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteButton(button)}
                      activeOpacity={0.8}
                    >
                      <Feather name="trash-2" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
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
    fontSize: 28,
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
  createButton: {
    backgroundColor: '#3a7bd5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    elevation: 2,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonsContainer: {
    gap: 16,
  },
  buttonCard: {
    backgroundColor: '#FDF6E3',
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5D6B5',
  },
  buttonDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  childPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5D6B5',
  },
  buttonChild: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  buttonActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#3a7bd5',
  },
  editButtonText: {
    color: '#3a7bd5',
    fontWeight: '700',
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
