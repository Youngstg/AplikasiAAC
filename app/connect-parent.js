import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  TextInput
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
  updateDoc
} from 'firebase/firestore';

export default function ConnectParent() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const connectWithParent = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setLoading(true);

    try {
      // Find the invite code
      const inviteQuery = query(
        collection(db, 'invite-codes'),
        where('code', '==', inviteCode.toUpperCase()),
        where('used', '==', false)
      );
      
      const inviteSnapshot = await getDocs(inviteQuery);
      
      if (inviteSnapshot.empty) {
        Alert.alert('Error', 'Invalid or expired invite code');
        setLoading(false);
        return;
      }

      const inviteDoc = inviteSnapshot.docs[0];
      const inviteData = inviteDoc.data();
      
      // Check if code is expired
      if (new Date(inviteData.expiresAt) < new Date()) {
        Alert.alert('Error', 'This invite code has expired');
        setLoading(false);
        return;
      }

      // Check if already connected
      const existingConnectionQuery = query(
        collection(db, 'parent-child-connections'),
        where('parentId', '==', inviteData.parentId),
        where('childId', '==', currentUser.uid)
      );
      
      const existingSnapshot = await getDocs(existingConnectionQuery);
      
      if (!existingSnapshot.empty) {
        Alert.alert('Already Connected', 'You are already connected to this parent');
        setLoading(false);
        return;
      }

      // Create parent-child connection
      await addDoc(collection(db, 'parent-child-connections'), {
        parentId: inviteData.parentId,
        parentEmail: inviteData.parentEmail,
        parentName: inviteData.parentName,
        childId: currentUser.uid,
        childEmail: currentUser.email,
        childName: currentUser.displayName || currentUser.email,
        connectedAt: new Date().toISOString(),
        status: 'active'
      });

      // Mark invite code as used
      await updateDoc(doc(db, 'invite-codes', inviteDoc.id), {
        used: true,
        usedBy: currentUser.uid,
        usedAt: new Date().toISOString()
      });

      Alert.alert(
        'Success!',
        `You are now connected to ${inviteData.parentName}. They can now create communication buttons for you.`,
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );

    } catch (error) {
      console.error('Error connecting with parent:', error);
      Alert.alert('Error', 'Failed to connect with parent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Connect with Parent</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.description}>
            Enter the invite code that your parent shared with you to connect your accounts.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Invite Code:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter invite code (e.g., ABC123)"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[styles.connectButton, loading && styles.connectButtonDisabled]}
            onPress={connectWithParent}
            disabled={loading}
          >
            <Text style={styles.connectButtonText}>
              {loading ? 'Connecting...' : 'Connect with Parent'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>How it works:</Text>
            <Text style={styles.infoText}>
              1. Your parent creates an invite code in their app
            </Text>
            <Text style={styles.infoText}>
              2. They share the code with you
            </Text>
            <Text style={styles.infoText}>
              3. Enter the code here to connect
            </Text>
            <Text style={styles.infoText}>
              4. Your parent can now create custom communication buttons for you
            </Text>
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
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    backgroundColor: '#007AFF',
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
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    backgroundColor: '#fafafa',
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  connectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  connectButtonDisabled: {
    backgroundColor: '#ccc',
  },
  connectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});