import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { queryRecords, deleteRecord } from '../services/database.service';
import { createInviteCode as createInvite } from '../services/invite.service';
import AuthLayout from '../components/AuthLayout';

export default function ManageChildren() {
  const { currentUser, userRole } = useAuth();
  const router = useRouter();
  const [connections, setConnections] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [fetchingConnections, setFetchingConnections] = useState(false);

  const isParent = userRole !== 'child';
  const getConnectionLabel = () => {
    if (isParent) {
      return connections.length === 1 ? 'child' : 'children';
    }
    return connections.length === 1 ? 'parent' : 'parents';
  };

  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }
    loadConnections();
  }, [currentUser, userRole]);

  useEffect(() => {
    if (isParent) {
      generateInviteCode();
    }
  }, [isParent]);

  const generateInviteCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);
  };

  const loadConnections = async () => {
    if (!currentUser?.uid) {
      return;
    }

    setFetchingConnections(true);

    try {
      const roleField = isParent ? 'parentId' : 'childId';
      const result = await queryRecords('parent-child-connections', roleField, currentUser.uid);

      if (result.success) {
        setConnections(result.data);
      } else {
        Alert.alert('Error', 'Failed to load connections. Please try again.');
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      Alert.alert('Error', 'Failed to load connections. Please try again.');
    } finally {
      setFetchingConnections(false);
    }
  };

  const createInviteCode = async () => {
    if (!isParent) {
      return;
    }

    setLoadingInvite(true);

    try {
      const result = await createInvite({
        code: inviteCode,
        parentId: currentUser.uid,
        parentEmail: currentUser.email,
        parentName: currentUser.displayName || currentUser.email,
        used: false,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      if (result.success) {
        Alert.alert(
          'Invite Code Ready',
          `Share this code with your child: ${inviteCode}`,
          [
            { text: 'Close' },
            {
              text: 'Share Now',
              onPress: shareInviteCode,
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create invite code. Please try again.');
      }
    } catch (error) {
      console.error('Error creating invite code:', error);
      Alert.alert('Error', 'Failed to create invite code. Please try again.');
    } finally {
      setLoadingInvite(false);
    }
  };

  const shareInviteCode = async () => {
    try {
      await Share.share({
        message: `Let's connect on the AAC app! Use this invite code within 24 hours: ${inviteCode}`,
        title: 'AAC App Invite Code',
      });
    } catch (error) {
      console.error('Error sharing invite code:', error);
    }
  };

  const handleRemoveConnection = (connectionId) => {
    const actionLabel = isParent ? 'Remove' : 'Disconnect';
    const title = isParent ? 'Remove Child' : 'Disconnect Parent';
    const message = isParent
      ? 'Are you sure you want to remove this child connection?'
      : 'Are you sure you want to disconnect from this parent?';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: actionLabel,
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await deleteRecord(`parent-child-connections/${connectionId}`);
            if (result.success) {
              loadConnections();
              Alert.alert(
                'Success',
                isParent ? 'Child removed successfully.' : 'Disconnected successfully.'
              );
            } else {
              Alert.alert('Error', 'Failed to update the connection. Please try again.');
            }
          } catch (error) {
            console.error('Error removing connection:', error);
            Alert.alert('Error', 'Failed to update the connection. Please try again.');
          }
        },
      },
    ]);
  };

  const formatDate = (value) => {
    if (!value) {
      return 'unknown date';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'unknown date';
    }

    return date.toLocaleDateString();
  };

  const getInitials = (name = '') => {
    if (!name.trim()) {
      return 'AA';
    }

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const renderConnectionCard = (item) => {
    const displayName = isParent
      ? item.childName || item.childEmail
      : item.parentName || item.parentEmail;
    const secondaryText = isParent ? item.childEmail : item.parentEmail;
    const actionIcon = isParent ? 'user-x' : 'log-out';
    const actionText = isParent ? 'Remove' : 'Leave';

    return (
      <View key={item.id} style={styles.connectionCard}>
        <View style={styles.connectionAvatar}>
          <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
        </View>

        <View style={styles.connectionBody}>
          <Text style={styles.connectionName}>{displayName}</Text>
          {!!secondaryText && <Text style={styles.connectionEmail}>{secondaryText}</Text>}

          <View style={styles.connectionMetaRow}>
            <Feather name="clock" size={14} color="#666" style={styles.connectionMetaIcon} />
            <Text style={styles.connectionMetaText}>Connected {formatDate(item.connectedAt)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.connectionAction}
          onPress={() => handleRemoveConnection(item.id)}
          activeOpacity={0.8}
        >
          <Feather name={actionIcon} size={16} color="#FF6B6B" />
          <Text style={styles.connectionActionText}>{actionText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <AuthLayout>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          {/* Pastel Theme Header */}
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
                {isParent ? 'Children' : 'Connections'}
              </Text>
            </View>
          </View>

          {/* Connected Children Count */}
          <View style={styles.cardContainer}>
            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Feather name="users" size={18} color="#333" style={styles.metaPillIcon} />
                <Text style={styles.metaPillText}>
                  {connections.length} linked {getConnectionLabel()}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.refreshButton, fetchingConnections && styles.refreshButtonDisabled]}
                onPress={loadConnections}
                disabled={fetchingConnections}
                activeOpacity={0.8}
              >
                {fetchingConnections ? (
                  <ActivityIndicator size="small" color="#333" />
                ) : (
                  <>
                    <Feather name="refresh-cw" size={16} color="#333" />
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {isParent ? (
            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Feather name="key" size={24} color="#3a7bd5" />
                </View>
                <View style={styles.cardHeaderTextContainer}>
                  <Text style={styles.cardTitle}>Create an Invite Code</Text>
                  <Text style={styles.cardSubtitle}>
                    Generate a secure code and share it with your child. Codes expire after 24 hours.
                  </Text>
                </View>
              </View>

              <View style={styles.codeWrapper}>
                <Text style={styles.codeText}>{inviteCode}</Text>
                <TouchableOpacity
                  style={styles.codeSmallButton}
                  onPress={generateInviteCode}
                  activeOpacity={0.8}
                >
                  <Feather name="refresh-cw" size={20} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.codeActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={generateInviteCode}
                  activeOpacity={0.85}
                  disabled={loadingInvite}
                >
                  <Feather name="shuffle" size={18} color="#333" />
                  <Text style={styles.secondaryButtonText}>Regenerate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, loadingInvite && styles.primaryButtonDisabled]}
                  onPress={createInviteCode}
                  activeOpacity={0.85}
                  disabled={loadingInvite}
                >
                  <Feather name="share-2" size={18} color="#ffffff" />
                  <Text style={styles.primaryButtonText}>
                    {loadingInvite ? 'Saving...' : 'Save & Share'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Feather name="link-2" size={24} color="#3a7bd5" />
                </View>
                <View style={styles.cardHeaderTextContainer}>
                  <Text style={styles.cardTitle}>Connect with a Parent</Text>
                  <Text style={styles.cardSubtitle}>
                    Use the invite code shared by your parent to stay synced with their updates.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/connect-parent')}
                activeOpacity={0.85}
              >
                <Feather name="log-in" size={18} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Enter Invite Code</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Feather name={isParent ? 'user-check' : 'shield'} size={24} color="#3a7bd5" />
              </View>
              <View style={styles.cardHeaderTextContainer}>
                <Text style={styles.cardTitle}>
                  {isParent ? 'Linked Children' : 'Connected Parents'}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {isParent
                    ? 'Keep track of who can access the buttons you create.'
                    : 'These parents can update communication buttons for you.'}
                </Text>
              </View>
            </View>

            {fetchingConnections ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color="#3a7bd5" />
                <Text style={[styles.emptyStateText, styles.emptyStateLoading]}>
                  Loading connections...
                </Text>
              </View>
            ) : connections.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="user-x" size={48} color="#ccc" style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateTitle}>No connections yet</Text>
                <Text style={styles.emptyStateText}>
                  {isParent
                    ? 'Generate and share a new invite code to link with your child.'
                    : 'Use an invite code from your parent to connect your account.'}
                </Text>
              </View>
            ) : (
              <View style={styles.connectionList}>
                {connections.map((item) => renderConnectionCard(item))}
              </View>
            )}
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaPillIcon: {
    marginRight: 8,
  },
  metaPillText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '700',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5D6B5',
    gap: 8,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardHeaderTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  codeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5D6B5',
  },
  codeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    letterSpacing: 8,
  },
  codeSmallButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5D6B5',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    gap: 8,
    elevation: 2,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    textAlign: 'center',
  },
  emptyStateLoading: {
    marginTop: 16,
  },
  connectionList: {
    gap: 16,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5D6B5',
  },
  connectionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5D6B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  connectionBody: {
    flex: 1,
    marginHorizontal: 16,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  connectionEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  connectionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionMetaIcon: {
    marginRight: 6,
  },
  connectionMetaText: {
    fontSize: 12,
    color: '#888',
  },
  connectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
  },
  connectionActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B6B',
  },
});
