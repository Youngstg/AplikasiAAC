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

const COLORS = { ink: '#17324D', ocean: '#176B87', aqua: '#64CCC5', sun: '#FFCF5C', mist: '#EDF8F7', white: '#FFFFFF' };
const BODY_FONT = 'Trebuchet MS';
const DISPLAY_FONT = 'Georgia';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('parent');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup, currentUser, userRole } = useAuth();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isNarrow = width < 640;
  const isShort = height < 760;

  React.useEffect(() => {
    if (currentUser && userRole) router.replace('/');
  }, [currentUser, userRole]);

  React.useEffect(() => {
    const lock = async () => { try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT); } catch {} };
    lock();
    return () => { try { ScreenOrientation.unlockAsync(); } catch {} };
  }, []);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  const handleSignup = async () => {
    if (!email || !name || !password || !confirmPassword) {
      showAlert('Data belum lengkap', 'Silakan isi semua kolom wajib.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Kata sandi tidak sama', 'Pastikan kedua kata sandi sama.');
      return;
    }
    if (password.length < 6) {
      showAlert('Kata sandi terlalu pendek', 'Gunakan minimal 6 karakter.');
      return;
    }
    if (role === 'parent' && !phoneNumber) {
      showAlert('Nomor telepon diperlukan', 'Masukkan nomor telepon untuk akun orang tua.');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, { name, role, phoneNumber: role === 'parent' ? phoneNumber : null });
      try { Alert.alert('Berhasil', 'Akun berhasil dibuat!'); } catch {}
      router.replace('/');
    } catch (error) {
      let errorMessage = 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.';
      if (error.code === 'auth/email-already-in-use') errorMessage = 'Email sudah terdaftar. Gunakan email lain atau masuk ke akun Anda.';
      else if (error.code === 'auth/weak-password') errorMessage = 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
      else if (error.code === 'auth/invalid-email') errorMessage = 'Format email tidak valid.';
      else if (error.code === 'auth/network-request-failed') errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
      else if (error.message) errorMessage = error.message;
      showAlert('Gagal mendaftar', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const PasswordField = ({ label, value, onChangeText, visible, onToggle, accessibilityLabel }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Minimal 6 karakter"
          placeholderTextColor="#708496"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          accessibilityLabel={accessibilityLabel}
          autoComplete="new-password"
        />
        <TouchableOpacity style={styles.eyeButton} onPress={onToggle} accessibilityRole="button" accessibilityLabel={visible ? `Sembunyikan ${label.toLowerCase()}` : `Tampilkan ${label.toLowerCase()}`}>
          <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={22} color={COLORS.ocean} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <AuthLayout>
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[styles.scrollContainer, isShort && styles.scrollContainerShort]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View style={[styles.card, isNarrow && styles.cardNarrow, isShort && styles.cardShort]}>
            <View style={styles.header}>
              <View style={[styles.logoContainer, isShort && styles.logoContainerShort]}>
                <Image source={require('../assets/LOGO.png')} style={styles.logoImage} accessibilityLabel="Logo aplikasi AAC" />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>MULAI BERSAMA</Text>
                <Text style={[styles.title, isShort && styles.titleShort]}>Buat akun</Text>
                <Text style={styles.subtitle}>Siapkan ruang komunikasi yang sesuai untuk keluarga Anda.</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nama lengkap</Text>
              <TextInput style={styles.input} placeholder="Masukkan nama lengkap" placeholderTextColor="#708496" value={name} onChangeText={setName} autoComplete="name" accessibilityLabel="Nama lengkap" />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="nama@email.com" placeholderTextColor="#708496" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" accessibilityLabel="Alamat email" />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Daftar sebagai</Text>
              <View style={styles.roleContainer} accessibilityRole="radiogroup" accessibilityLabel="Pilih jenis akun">
                <TouchableOpacity style={[styles.roleButton, role === 'parent' && styles.roleButtonActive]} onPress={() => setRole('parent')} accessibilityRole="radio" accessibilityState={{ checked: role === 'parent' }} accessibilityLabel="Orang tua">
                  <Ionicons name="people-outline" size={20} color={role === 'parent' ? COLORS.ink : COLORS.ocean} />
                  <Text style={[styles.roleText, role === 'parent' && styles.roleTextActive]}>Orang tua</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.roleButton, role === 'child' && styles.roleButtonActive]} onPress={() => setRole('child')} accessibilityRole="radio" accessibilityState={{ checked: role === 'child' }} accessibilityLabel="Anak">
                  <Ionicons name="happy-outline" size={20} color={role === 'child' ? COLORS.ink : COLORS.ocean} />
                  <Text style={[styles.roleText, role === 'child' && styles.roleTextActive]}>Anak</Text>
                </TouchableOpacity>
              </View>
            </View>
            {role === 'parent' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nomor telepon</Text>
                <TextInput style={styles.input} placeholder="Contoh: 081234567890" placeholderTextColor="#708496" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" autoComplete="tel" accessibilityLabel="Nomor telepon orang tua" />
              </View>
            )}
            <PasswordField label="Kata sandi" value={password} onChangeText={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} accessibilityLabel="Kata sandi" />
            <PasswordField label="Ulangi kata sandi" value={confirmPassword} onChangeText={setConfirmPassword} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} accessibilityLabel="Ulangi kata sandi" />

            <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleSignup} disabled={loading} accessibilityRole="button" accessibilityLabel={loading ? 'Sedang membuat akun' : 'Buat akun'}>
              <Text style={styles.primaryButtonText}>{loading ? 'Sedang membuat akun…' : 'Buat akun'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={20} color={COLORS.ink} />}
            </TouchableOpacity>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Sudah punya akun?</Text>
              <TouchableOpacity onPress={() => router.push('/login')} accessibilityRole="link" accessibilityLabel="Masuk ke akun">
                <Text style={styles.footerLink}>Masuk</Text>
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
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  scrollContainerShort: { justifyContent: 'flex-start', paddingVertical: 12 },
  card: { width: '100%', maxWidth: 620, backgroundColor: COLORS.white, borderRadius: 28, padding: 36, borderWidth: 1, borderColor: '#D8EEEC', shadowColor: COLORS.ink, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.11, shadowRadius: 28, elevation: 8 },
  cardNarrow: { padding: 24, borderRadius: 22 },
  cardShort: { paddingVertical: 20 },
  header: { alignItems: 'center', marginBottom: 26 },
  logoContainer: { width: 96, height: 96, borderRadius: 28, backgroundColor: COLORS.mist, justifyContent: 'center', alignItems: 'center', marginBottom: 16, transform: [{ rotate: '2deg' }] },
  logoContainerShort: { width: 68, height: 68, borderRadius: 20, marginBottom: 10 },
  logoImage: { width: '88%', height: '88%', resizeMode: 'contain' },
  headerCopy: { alignItems: 'center' },
  eyebrow: { fontFamily: BODY_FONT, fontSize: 12, fontWeight: '700', letterSpacing: 1.8, color: COLORS.ocean, marginBottom: 5 },
  title: { fontFamily: DISPLAY_FONT, fontSize: 34, lineHeight: 40, fontWeight: '700', color: COLORS.ink, textAlign: 'center' },
  titleShort: { fontSize: 28, lineHeight: 33 },
  subtitle: { maxWidth: 390, fontFamily: BODY_FONT, fontSize: 15, lineHeight: 22, color: '#50677A', textAlign: 'center', marginTop: 7 },
  fieldGroup: { marginBottom: 17 },
  label: { fontFamily: BODY_FONT, fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
  input: { width: '100%', minHeight: 52, borderRadius: 14, borderWidth: 1.5, borderColor: '#B9D9D6', backgroundColor: '#FAFDFC', paddingHorizontal: 16, fontFamily: BODY_FONT, fontSize: 16, color: COLORS.ink },
  passwordContainer: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 56 },
  eyeButton: { position: 'absolute', right: 4, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  roleContainer: { flexDirection: 'row', gap: 12 },
  roleButton: { flex: 1, minHeight: 52, borderRadius: 14, borderWidth: 1.5, borderColor: '#B9D9D6', backgroundColor: '#FAFDFC', flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  roleButtonActive: { backgroundColor: COLORS.aqua, borderColor: COLORS.ocean },
  roleText: { fontFamily: BODY_FONT, fontSize: 15, fontWeight: '700', color: COLORS.ocean },
  roleTextActive: { color: COLORS.ink },
  primaryButton: { minHeight: 54, borderRadius: 16, backgroundColor: COLORS.sun, flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center', marginTop: 3, shadowColor: '#B98916', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.22, shadowRadius: 9, elevation: 4 },
  primaryButtonText: { fontFamily: BODY_FONT, fontSize: 17, fontWeight: '700', color: COLORS.ink },
  buttonDisabled: { opacity: 0.62 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, marginTop: 24 },
  footerText: { fontFamily: BODY_FONT, fontSize: 15, color: '#50677A' },
  footerLink: { fontFamily: BODY_FONT, fontSize: 15, fontWeight: '700', color: COLORS.ocean, textDecorationLine: 'underline' },
});
