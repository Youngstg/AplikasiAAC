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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

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
      const connectionsQuery = query(
        collection(db, 'parent-child-connections'),
        where(roleField, '==', currentUser.uid)
      );

      const snapshot = await getDocs(connectionsQuery);
      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setConnections(data);
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
      await addDoc(collection(db, 'invite-codes'), {
        code: inviteCode,
        parentId: currentUser.uid,
        parentEmail: currentUser.email,
        parentName: currentUser.displayName || currentUser.email,
        createdAt: new Date().toISOString(),
        used: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

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
            await deleteDoc(doc(db, 'parent-child-connections', connectionId));
            loadConnections();
            Alert.alert(
              'Success',
              isParent ? 'Child removed successfully.' : 'Disconnected successfully.'
            );
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
            <Feather name="clock" size={14} color="#9ba1b7" style={styles.connectionMetaIcon} />
            <Text style={styles.connectionMetaText}>Connected {formatDate(item.connectedAt)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.connectionAction}
          onPress={() => handleRemoveConnection(item.id)}
          activeOpacity={0.8}
        >
          <Feather name={actionIcon} size={16} color="#3c2ba8" />
          <Text style={styles.connectionActionText}>{actionText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={['#5f2eea', '#3a7bd5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Feather name="arrow-left" size={20} color="#ffffff" />
              </TouchableOpacity>

              <View style={styles.titleGroup}>
                <Text style={styles.headerTitle}>
                  Manage {isParent ? 'Children' : 'Connections'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {isParent
                    ? 'Invite, review, and manage linked child accounts in one place.'
                    : 'Stay connected with the parents who support your communication.'}
                </Text>
              </View>
            </View>

            <View style={styles.headerMetaRow}>
              <View style={styles.metaPill}>
                <Feather name="users" size={16} color="#ffffff" style={styles.metaPillIcon} />
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
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Feather name="refresh-cw" size={16} color="#ffffff" />
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {isParent ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Feather name="key" size={20} color="#3c2ba8" />
              </View>
              <View>
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
                <Feather name="refresh-cw" size={18} color="#3c2ba8" />
              </TouchableOpacity>
            </View>

            <View style={styles.codeActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={generateInviteCode}
                activeOpacity={0.85}
                disabled={loadingInvite}
              >
                <Feather name="shuffle" size={16} color="#3c2ba8" />
                <Text style={styles.secondaryButtonText}>Regenerate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, loadingInvite && styles.primaryButtonDisabled]}
                onPress={createInviteCode}
                activeOpacity={0.85}
                disabled={loadingInvite}
              >
                <Feather name="share-2" size={16} color="#ffffff" />
                <Text style={styles.primaryButtonText}>
                  {loadingInvite ? 'Saving...' : 'Save & Share'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardHint}>
              Tip: share the code right away so it does not expire. If you need a fresh one, tap
              Regenerate.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Feather name="link-2" size={20} color="#3c2ba8" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Connect with a Parent</Text>
                <Text style={styles.cardSubtitle}>
                  Use the invite code shared by your parent to stay synced with their updates.
                </Text>
              </View>
            </View>

            <Text style={styles.cardHint}>
              Ask your parent for their latest invite code. Each code can only be used once and
              expires after 24 hours.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/connect-parent')}
              activeOpacity={0.85}
            >
              <Feather name="log-in" size={16} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Enter Invite Code</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Feather name={isParent ? 'user-check' : 'shield'} size={20} color="#3c2ba8" />
            </View>
            <View>
              <Text style={styles.cardTitle}>
                {isParent ? 'Linked Children' : 'Connected Parents'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {isParent
                  ? 'Keep track of who can access and use the communication buttons you create.'
                  : 'These parents can create and update communication buttons for you.'}
              </Text>
            </View>
          </View>

          {fetchingConnections ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color="#3c2ba8" />
              <Text style={[styles.emptyStateText, styles.emptyStateLoading]}>
                Loading connections...
              </Text>
            </View>
          ) : connections.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="user-x" size={40} color="#c1c5d7" style={styles.emptyStateIcon} />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f8',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 12,
  },
  headerGradient: {
    borderRadius: 28,
    padding: 24,
    paddingTop: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  headerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  metaPillIcon: {
    marginRight: 10,
  },
  metaPillText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    gap: 8,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 22,
    padding: 22,
    elevation: 4,
    shadowColor: '#1d1f2f',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 18,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f2f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2741',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#66708a',
  },
  codeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f6ff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 18,
  },
  codeText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#3c2ba8',
    letterSpacing: 6,
  },
  codeSmallButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dfe2f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#eef0ff',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3c2ba8',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#3c2ba8',
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardHint: {
    fontSize: 12,
    lineHeight: 18,
    color: '#8a90ab',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyStateIcon: {
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2741',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6d748d',
    textAlign: 'center',
  },
  emptyStateLoading: {
    marginTop: 12,
  },
  connectionList: {
    gap: 14,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#e6e9f8',
  },
  connectionAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#e4e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3c2ba8',
  },
  connectionBody: {
    flex: 1,
    marginHorizontal: 16,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2741',
    marginBottom: 4,
  },
  connectionEmail: {
    fontSize: 13,
    color: '#6d748d',
    marginBottom: 10,
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
    color: '#8a90ab',
  },
  connectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#eae7ff',
  },
  connectionActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c2ba8',
  },
});







