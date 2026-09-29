import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

const COLORS = {
  ink: '#17324D', ocean: '#176B87', aqua: '#64CCC5', sun: '#FFCF5C', mist: '#EDF8F7', white: '#FFFFFF',
};
const BODY_FONT = 'Trebuchet MS';
const DISPLAY_FONT = 'Georgia';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signin, currentUser, userRole } = useAuth();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isNarrow = width < 640;
  const isShort = height < 700;

  React.useEffect(() => {
    if (currentUser && userRole) router.replace('/');
  }, [currentUser, userRole]);

  React.useEffect(() => {
    const lock = async () => {
      try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT); } catch {}
    };
    lock();
    return () => { try { ScreenOrientation.unlockAsync(); } catch {} };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      const message = 'Silakan masukkan email dan kata sandi.';
      if (Platform.OS === 'web') alert(message);
      else Alert.alert('Data belum lengkap', message);
      return;
    }
    setLoading(true);
    try {
      await signin(email, password);
      router.replace('/');
    } catch (error) {
      let errorMessage = 'Terjadi kesalahan saat masuk. Silakan coba lagi.';
      if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(error.code)) {
        errorMessage = 'Email atau kata sandi salah. Silakan periksa kembali.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Terlalu banyak percobaan gagal. Silakan coba lagi nanti.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
      } else if (error.message) errorMessage = error.message;
      if (Platform.OS === 'web') alert(`Gagal masuk: ${errorMessage}`);
      else Alert.alert('Gagal masuk', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, isShort && styles.scrollContainerShort]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.card, isNarrow && styles.cardNarrow, isShort && styles.cardShort]}>
            <View style={styles.brandRow}>
              <View style={[styles.logoContainer, isShort && styles.logoContainerShort]}>
                <Image source={require('../assets/LOGO.png')} style={styles.logoImage} accessibilityLabel="Logo aplikasi AAC" />
              </View>
              <View style={styles.brandCopy}>
                <Text style={styles.eyebrow}>RUANG KOMUNIKASI</Text>
                <Text style={[styles.title, isShort && styles.titleShort]}>Selamat datang</Text>
                <Text style={styles.subtitle}>Masuk untuk melanjutkan komunikasi yang lebih mudah.</Text>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="nama@email.com"
                  placeholderTextColor="#708496"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  accessibilityLabel="Alamat email"
                  returnKeyType="next"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Kata sandi</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Masukkan kata sandi"
                    placeholderTextColor="#708496"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    accessibilityLabel="Kata sandi"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((value) => !value)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color={COLORS.ocean} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.forgotButton} onPress={() => router.push('/forgot-password')} accessibilityRole="link" accessibilityLabel="Lupa kata sandi">
                  <Text style={styles.forgotText}>Lupa kata sandi?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading} accessibilityRole="button" accessibilityLabel={loading ? 'Sedang masuk' : 'Masuk'}>
                <Text style={styles.primaryButtonText}>{loading ? 'Sedang masuk…' : 'Masuk'}</Text>
                {!loading && <Ionicons name="arrow-forward" size={20} color={COLORS.ink} />}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Belum punya akun?</Text>
              <TouchableOpacity onPress={() => router.push('/signup')} accessibilityRole="link" accessibilityLabel="Daftar akun baru">
                <Text style={styles.footerLink}>Daftar sekarang</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 36 },
  scrollContainerShort: { justifyContent: 'flex-start', paddingVertical: 14 },
  card: { width: '100%', maxWidth: 560, backgroundColor: COLORS.white, borderRadius: 28, padding: 36, borderWidth: 1, borderColor: '#D8EEEC', shadowColor: COLORS.ink, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.11, shadowRadius: 28, elevation: 8 },
  cardNarrow: { padding: 24, borderRadius: 22 },
  cardShort: { paddingVertical: 20 },
  brandRow: { alignItems: 'center', marginBottom: 28 },
  logoContainer: { width: 112, height: 112, borderRadius: 32, backgroundColor: COLORS.mist, justifyContent: 'center', alignItems: 'center', marginBottom: 18, transform: [{ rotate: '-2deg' }] },
  logoContainerShort: { width: 76, height: 76, borderRadius: 23, marginBottom: 12 },
  logoImage: { width: '88%', height: '88%', resizeMode: 'contain' },
  brandCopy: { alignItems: 'center', maxWidth: 400 },
  eyebrow: { fontFamily: BODY_FONT, fontSize: 12, fontWeight: '700', letterSpacing: 1.8, color: COLORS.ocean, marginBottom: 6 },
  title: { fontFamily: DISPLAY_FONT, fontSize: 34, lineHeight: 40, fontWeight: '700', color: COLORS.ink, textAlign: 'center' },
  titleShort: { fontSize: 29, lineHeight: 34 },
  subtitle: { fontFamily: BODY_FONT, fontSize: 15, lineHeight: 22, color: '#50677A', textAlign: 'center', marginTop: 8 },
  form: { width: '100%' },
  fieldGroup: { marginBottom: 18 },
  label: { fontFamily: BODY_FONT, fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
  input: { width: '100%', minHeight: 52, borderRadius: 14, borderWidth: 1.5, borderColor: '#B9D9D6', backgroundColor: '#FAFDFC', paddingHorizontal: 16, fontFamily: BODY_FONT, fontSize: 16, color: COLORS.ink },
  passwordContainer: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 56 },
  eyeButton: { position: 'absolute', right: 4, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  forgotButton: { alignSelf: 'flex-end', paddingVertical: 10, paddingLeft: 12 },
  forgotText: { fontFamily: BODY_FONT, fontSize: 14, fontWeight: '700', color: COLORS.ocean },
  primaryButton: { minHeight: 54, borderRadius: 16, backgroundColor: COLORS.sun, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#B98916', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.22, shadowRadius: 9, elevation: 4 },
  primaryButtonText: { fontFamily: BODY_FONT, fontSize: 17, fontWeight: '700', color: COLORS.ink },
  buttonDisabled: { opacity: 0.62 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, marginTop: 24 },
  footerText: { fontFamily: BODY_FONT, fontSize: 15, color: '#50677A' },
  footerLink: { fontFamily: BODY_FONT, fontSize: 15, fontWeight: '700', color: COLORS.ocean, textDecorationLine: 'underline' },
});
