import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Reset Password' }} />
        <Stack.Screen name="parent" options={{ headerShown: false }} />
        <Stack.Screen name="child" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}