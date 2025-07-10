import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
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
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={{ marginTop: 10 }}>Loading...</Text>
      <Text style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
        User: {currentUser ? 'Authenticated' : 'Not authenticated'}
      </Text>
      <Text style={{ fontSize: 12, color: '#666' }}>
        Role: {userRole || 'Loading...'}
      </Text>
    </View>
  );
}