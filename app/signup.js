import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AuthLayout from '../components/AuthLayout';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('parent'); // Default to parent
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { signup, currentUser, userRole } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Responsive calculations
  const isMobile = width < 640;
  const isTablet = width >= 640 && width <= 1024;
  
  const cardMaxWidth = isMobile ? '95%' : (isTablet ? 560 : 600);
  const cardPadding = isMobile ? 24 : 40;
  const cardBorderRadius = isMobile ? 20 : 32;

  React.useEffect(() => {
    if (currentUser && userRole) {
      router.replace('/');
    }
  }, [currentUser, userRole]);

  React.useEffect(() => {
    const lock = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      } catch {}
    };
    lock();
    return () => {
      try { ScreenOrientation.unlockAsync(); } catch {}
    };
  }, []);

  const handleSignup = async () => {
    if (!email || !name || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (role === 'parent' && !phoneNumber) {
      Alert.alert('Error', 'Phone number is required for parent accounts');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        name,
        role,
        phoneNumber: role === 'parent' ? phoneNumber : null
      };

      await signup(email, password, userData);
      try { Alert.alert('Success', 'Account created successfully!'); } catch {}
      router.replace('/');
    } catch (error) {
      let errorMessage = 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain atau langsung Login.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Sandi terlalu lemah. Gunakan minimal 6 karakter.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (Platform.OS === 'web') {
        alert(`Gagal Mendaftar: ${errorMessage}`);
      } else {
        Alert.alert('Gagal Mendaftar', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          
          <View 
            style={[
              styles.card, 
              { 
                width: cardMaxWidth,
                padding: cardPadding,
                borderRadius: cardBorderRadius
              }
            ]}
          >
            {/* Accent circle top left */}
            <View style={styles.accentCircle} />

            <View style={styles.logoContainer}>
              <Image source={require('../assets/LOGO.png')} style={styles.logoImage} />
            </View>

            {/* Title */}
            {/* Removed title per request */}

            {/* Form */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>I am a:</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'parent' && styles.roleButtonActive]}
                  onPress={() => setRole('parent')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleButtonText, role === 'parent' && styles.roleButtonTextActive]}>
                    Parent
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'child' && styles.roleButtonActive]}
                  onPress={() => setRole('child')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleButtonText, role === 'child' && styles.roleButtonTextActive]}>
                    Child
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {role === 'parent' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={22} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                    size={22} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Creating...' : 'Continue'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Logins */}
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <FontAwesome name="google" size={20} color="#DB4437" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <FontAwesome name="facebook" size={20} color="#4267B2" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Continue with Facebook</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already a member? </Text>
              <TouchableOpacity 
                onPress={() => router.push('/login')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.footerLink}>Login</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  card: {
    backgroundColor: '#FDF6E3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden', // Contains the accent circle
  },
  accentCircle: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFD1DC',
    opacity: 0.5,
  },
  logoContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFE5B4', // Warm pastel background (Peach/Yellow)
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  logoImage: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  title: {
    fontWeight: 'bold',
    color: '#222',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 24,
    textAlign: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#F2D79E',
    borderRadius: 9999, // Pill shape
    height: 48, // Accessible height
    marginBottom: 12,
  },
  socialIcon: {
    position: 'absolute',
    left: 20,
  },
  socialButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5D6B5',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#8A7A5C',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 52, // Accessible height
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6B5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    width: '100%',
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    height: 44, // Accessible touch target
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D6B5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#111',
  },
  primaryButton: {
    backgroundColor: '#F5A623',
    borderRadius: 9999, // Pill shape
    height: 52, // Accessible height
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#111',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 16,
  },
  footerLink: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
