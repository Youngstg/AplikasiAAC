import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthLayout from '../components/AuthLayout';

export default function ChildSettings() {
  const { logout, currentUser, getUserData } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [gridColumns, setGridColumns] = useState(6);

  useEffect(() => {
    if (currentUser?.uid) {
      getUserData(currentUser.uid).then((profile) => {
        setUserData(profile);
      });
    }
    loadGridSettings();
  }, [currentUser]);

  const loadGridSettings = async () => {
    try {
      const savedColumns = await AsyncStorage.getItem('childGridColumns');
      if (savedColumns) {
        setGridColumns(parseInt(savedColumns, 10));
      }
    } catch (error) {
      console.error('Failed to load grid settings:', error);
    }
  };

  const updateGridColumns = async (newVal) => {
    if (newVal < 2 || newVal > 12) return;
    setGridColumns(newVal);
    try {
      await AsyncStorage.setItem('childGridColumns', String(newVal));
    } catch (error) {
      console.error('Failed to save grid settings:', error);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) {
        try {
          await logout();
          router.replace('/login');
        } catch (error) {
          console.error('Logout error:', error);
          alert('Failed to logout');
        }
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            onPress: async () => {
              try {
                await logout();
                router.replace('/login');
              } catch (error) {
                console.error('Logout error:', error);
                Alert.alert('Error', 'Failed to logout');
              }
            }
          }
        ]
      );
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <AuthLayout>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              activeOpacity={0.8}
            >
              <Feather name="arrow-left" size={22} color="#333333" />
            </TouchableOpacity>
            <Text style={styles.title}>Settings</Text>
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.userSection}>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.usernameText}>{userData?.name || currentUser?.email}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.rowContainer}>
              <View style={styles.columnContainer}>
                <Text style={styles.sectionTitle}>Grid</Text>
                <View style={styles.gridSettingsContainer}>
                  <TouchableOpacity 
                    style={styles.gridButton} 
                    onPress={() => updateGridColumns(gridColumns - 1)}
                    disabled={gridColumns <= 2}
                  >
                    <Feather name="minus" size={20} color={gridColumns <= 2 ? "#ccc" : "#333"} />
                  </TouchableOpacity>
                  <View style={styles.gridValueContainer}>
                    <Text style={styles.gridValueText}>{gridColumns}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.gridButton} 
                    onPress={() => updateGridColumns(gridColumns + 1)}
                    disabled={gridColumns >= 12}
                  >
                    <Feather name="plus" size={20} color={gridColumns >= 12 ? "#ccc" : "#333"} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.columnContainer}>
                <Text style={styles.sectionTitle}>Actions</Text>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => router.push('/connect-parent')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickActionIcon}>
                    <Feather name="link" size={18} color="#3a7bd5" />
                  </View>
                  <Text style={styles.quickActionText}>Connect</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
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
  userSection: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 6,
  },
  usernameText: {
    fontSize: 16,
    color: '#666666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5D6B5',
    marginVertical: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  columnContainer: {
    flex: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  quickActionButton: {
    width: '100%',
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5D6B5',
    gap: 10,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  logoutContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  gridSettingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    height: 60,
    width: '100%',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5D6B5',
  },
  gridButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridValueContainer: {
    width: 40,
    alignItems: 'center',
  },
  gridValueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  }
});
