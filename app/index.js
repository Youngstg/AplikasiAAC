import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { currentUser, userRole } = useAuth();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    console.log('Index - currentUser:', currentUser);
    console.log('Index - userRole:', userRole);
    
    if (isNavigating) return;

    if (currentUser && userRole) {
      setIsNavigating(true);
      console.log('Navigating to:', userRole);
      
      // Redirect based on user role
      if (userRole === 'parent') {
        router.replace('/parent');
      } else if (userRole === 'child') {
        router.replace('/child');
      }
    } else if (currentUser === null) {
      setIsNavigating(true);
      console.log('No user, redirecting to login');
      // User is not authenticated, redirect to login
      router.replace('/login');
    }
  }, [currentUser, userRole, isNavigating]);

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <View style={styles.mark}>
        <Feather name="message-circle" size={34} color="#FFFFFF" />
      </View>
      <Text style={styles.title}>Menyiapkan ruang komunikasi</Text>
      <Text style={styles.subtitle}>Sebentar, kami sedang membuka halaman Anda.</Text>
      <ActivityIndicator size="small" color="#176B87" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#EDF8F7',
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    backgroundColor: '#176B87',
  },
  title: {
    color: '#17324D',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Georgia' : undefined,
  },
  subtitle: {
    maxWidth: 360,
    marginTop: 8,
    color: '#5C7285',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Trebuchet MS' : undefined,
  },
  spinner: {
    marginTop: 22,
  },
});