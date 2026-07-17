import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  TextInput,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getInviteByCode } from '../services/invite.service';
import { createConnection } from '../services/parent.service';
import { updateRecord } from '../services/database.service';
import AuthLayout from '../components/AuthLayout';
import { Feather } from '@expo/vector-icons';

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
      const inviteResult = await getInviteByCode(inviteCode.toUpperCase());

      if (!inviteResult.success || inviteResult.data.length === 0) {
        Alert.alert('Error', 'Invalid invite code');
        setLoading(false);
        return;
      }

      // Filter unused invites
      const validInvites = inviteResult.data.filter(invite => !invite.used);

      if (validInvites.length === 0) {
        Alert.alert('Error', 'This invite code has already been used');
        setLoading(false);
        return;
      }

      const inviteData = validInvites[0];

      // Check if code is expired
      if (inviteData.expiresAt && inviteData.expiresAt < Date.now()) {
        Alert.alert('Error', 'This invite code has expired');
        setLoading(false);
        return;
      }

      // Create parent-child connection
      const connectionResult = await createConnection({
        parentId: inviteData.parentId,
        parentEmail: inviteData.parentEmail,
        parentName: inviteData.parentName,
        childId: currentUser.uid,
        childEmail: currentUser.email,
        childName: currentUser.displayName || currentUser.email,
        connectedAt: Date.now(),
        status: 'active'
      });

      if (!connectionResult.success) {
        Alert.alert('Error', 'Failed to create connection. Please try again.');
        setLoading(false);
        return;
      }

      // Mark invite code as used
      await updateRecord(`invite-codes/${inviteData.id}`, {
        used: true,
        usedBy: currentUser.uid,
        usedAt: Date.now()
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
            <Text style={styles.title}>Connect with Parent</Text>
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
              activeOpacity={0.8}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  formContainer: {
    backgroundColor: '#FDF6E3',
    borderRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5D6B5',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    backgroundColor: '#ffffff',
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: 'bold',
    color: '#333',
    height: 52,
  },
  connectButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 15,
    borderRadius: 9999,
    alignItems: 'center',
    marginBottom: 30,
    height: 52,
    justifyContent: 'center',
  },
  connectButtonDisabled: {
    backgroundColor: '#E5D6B5',
  },
  connectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 20,
    borderRadius: 16,
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