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
  FlatList,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';

export default function ManageChildren() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChildren();
    generateInviteCode();
  }, []);

  const generateInviteCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);
  };

  const loadChildren = async () => {
    try {
      const connectionsQuery = query(
        collection(db, 'parent-child-connections'),
        where('parentId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(connectionsQuery);
      const childrenData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChildren(childrenData);
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const createInviteCode = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'invite-codes'), {
        code: inviteCode,
        parentId: currentUser.uid,
        parentEmail: currentUser.email,
        parentName: currentUser.displayName || currentUser.email,
        createdAt: new Date().toISOString(),
        used: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

      Alert.alert(
        'Invite Code Created',
        `Your invite code is: ${inviteCode}\n\nShare this code with your child to connect their account.`,
        [
          { text: 'OK' },
          { 
            text: 'Share', 
            onPress: () => shareInviteCode() 
          }
        ]
      );
    } catch (error) {
      console.error('Error creating invite code:', error);
      Alert.alert('Error', 'Failed to create invite code');
    } finally {
      setLoading(false);
    }
  };

  const shareInviteCode = async () => {
    try {
      await Share.share({
        message: `Hi! I'd like to connect with you on our AAC app. Please use this invite code: ${inviteCode}`,
        title: 'AAC App Invite Code'
      });
    } catch (error) {
      console.error('Error sharing invite code:', error);
    }
  };

  const removeChild = async (childId) => {
    Alert.alert(
      'Remove Child',
      'Are you sure you want to remove this child connection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'parent-child-connections', childId));
              loadChildren();
              Alert.alert('Success', 'Child connection removed');
            } catch (error) {
              console.error('Error removing child:', error);
              Alert.alert('Error', 'Failed to remove child connection');
            }
          }
        }
      ]
    );
  };

  const renderChildItem = ({ item }) => (
    <View style={styles.childItem}>
      <View style={styles.childInfo}>
        <Text style={styles.childName}>{item.childName}</Text>
        <Text style={styles.childEmail}>{item.childEmail}</Text>
        <Text style={styles.connectionDate}>
          Connected: {new Date(item.connectedAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeChild(item.id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Manage Children</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Invite Code</Text>
          <Text style={styles.sectionDescription}>
            Generate an invite code for your child to connect their account
          </Text>
          
          <View style={styles.inviteContainer}>
            <Text style={styles.codeLabel}>Invite Code:</Text>
            <Text style={styles.codeText}>{inviteCode}</Text>
            <TouchableOpacity style={styles.generateButton} onPress={generateInviteCode}>
              <Text style={styles.generateButtonText}>Generate New Code</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={createInviteCode}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create & Share Invite Code'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Children ({children.length})</Text>
          {children.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No children connected yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Create an invite code and share it with your child to get started
              </Text>
            </View>
          ) : (
            <FlatList
              data={children}
              renderItem={renderChildItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
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
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inviteContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#764ba2',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 2,
  },
  generateButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  generateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#764ba2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  childItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  childEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  connectionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
