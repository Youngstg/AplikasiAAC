import React, { useState } from 'react';
import {
  Alert,
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
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

const COLORS = { ink: '#17324D', ocean: '#176B87', aqua: '#64CCC5', sun: '#FFCF5C', mist: '#EDF8F7', white: '#FFFFFF' };
const BODY_FONT = 'Trebuchet MS';
const DISPLAY_FONT = 'Georgia';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const { resetPassword } = useAuth();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isNarrow = width < 640;
  const isShort = height < 650;

  const notify = (title, message, actions) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      if (actions?.[0]?.onPress) actions[0].onPress();
    } else Alert.alert(title, message, actions);
  };

  const handleResetPassword = async () => {
    if (!email) {
      notify('Email diperlukan', 'Silakan masukkan alamat email Anda.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      notify(
        'Email terkirim',
        'Tautan untuk mengatur ulang kata sandi telah dikirim. Silakan periksa kotak masuk Anda.',
        [{ text: 'Kembali ke masuk', onPress: () => router.push('/login') }]
      );
    } catch (error) {
      let message = 'Tautan belum dapat dikirim. Silakan coba lagi.';
      if (error.code === 'auth/invalid-email') message = 'Format email tidak valid.';
      else if (error.code === 'auth/user-not-found') message = 'Akun dengan email tersebut tidak ditemukan.';
      else if (error.code === 'auth/network-request-failed') message = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
      else if (error.message) message = error.message;
      notify('Gagal mengirim email', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[styles.scrollContainer, isShort && styles.scrollContainerShort]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View style={[styles.card, isNarrow && styles.cardNarrow, isShort && styles.cardShort]}>
            <View style={[styles.iconContainer, isShort && styles.iconContainerShort]} accessible accessibilityLabel="Ikon keamanan akun">
              <Ionicons name="key-outline" size={isShort ? 30 : 38} color={COLORS.ink} />
              <View style={styles.iconAccent} />
            </View>
            <Text style={styles.eyebrow}>PULIHKAN AKSES</Text>
            <Text style={[styles.title, isShort && styles.titleShort]}>Lupa kata sandi?</Text>
            <Text style={styles.subtitle}>Masukkan email akun Anda. Kami akan mengirimkan tautan aman untuk membuat kata sandi baru.</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailFocused && styles.inputFocused]}
                placeholder="nama@email.com"
                placeholderTextColor="#708496"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                onSubmitEditing={handleResetPassword}
                returnKeyType="send"
                accessibilityLabel="Alamat email untuk pemulihan kata sandi"
              />
            </View>

            <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleResetPassword} disabled={loading} accessibilityRole="button" accessibilityLabel={loading ? 'Sedang mengirim tautan' : 'Kirim tautan pemulihan'}>
              <Text style={styles.primaryButtonText}>{loading ? 'Sedang mengirim…' : 'Kirim tautan pemulihan'}</Text>
              {!loading && <Ionicons name="paper-plane-outline" size={19} color={COLORS.ink} />}
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Ionicons name="mail-unread-outline" size={22} color={COLORS.ocean} />
              <Text style={styles.infoText}>Periksa folder spam jika email belum terlihat setelah beberapa menit.</Text>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/login')} accessibilityRole="link" accessibilityLabel="Kembali ke halaman masuk">
              <Ionicons name="arrow-back" size={19} color={COLORS.ocean} />
              <Text style={styles.backButtonText}>Kembali ke halaman masuk</Text>
            </TouchableOpacity>
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
  card: { width: '100%', maxWidth: 520, backgroundColor: COLORS.white, borderRadius: 28, padding: 38, alignItems: 'center', borderWidth: 1, borderColor: '#D8EEEC', shadowColor: COLORS.ink, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.11, shadowRadius: 28, elevation: 8 },
  cardNarrow: { padding: 24, borderRadius: 22 },
  cardShort: { paddingVertical: 20 },
  iconContainer: { width: 88, height: 88, borderRadius: 28, backgroundColor: COLORS.aqua, justifyContent: 'center', alignItems: 'center', marginBottom: 20, transform: [{ rotate: '-3deg' }] },
  iconContainerShort: { width: 64, height: 64, borderRadius: 20, marginBottom: 12 },
  iconAccent: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.sun, top: -5, right: -4, borderWidth: 3, borderColor: COLORS.white },
  eyebrow: { fontFamily: BODY_FONT, fontSize: 12, fontWeight: '700', letterSpacing: 1.8, color: COLORS.ocean, marginBottom: 6 },
  title: { fontFamily: DISPLAY_FONT, fontSize: 34, lineHeight: 40, fontWeight: '700', color: COLORS.ink, textAlign: 'center' },
  titleShort: { fontSize: 28, lineHeight: 33 },
  subtitle: { maxWidth: 410, fontFamily: BODY_FONT, fontSize: 15, lineHeight: 23, color: '#50677A', textAlign: 'center', marginTop: 10, marginBottom: 26 },
  fieldGroup: { width: '100%', marginBottom: 18 },
  label: { fontFamily: BODY_FONT, fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
  input: { width: '100%', minHeight: 52, borderRadius: 14, borderWidth: 1.5, borderColor: '#B9D9D6', backgroundColor: '#FAFDFC', paddingHorizontal: 16, fontFamily: BODY_FONT, fontSize: 16, color: COLORS.ink },
  inputFocused: { borderColor: COLORS.ocean, backgroundColor: COLORS.white },
  primaryButton: { width: '100%', minHeight: 54, borderRadius: 16, backgroundColor: COLORS.sun, flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center', shadowColor: '#B98916', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.22, shadowRadius: 9, elevation: 4 },
  primaryButtonText: { fontFamily: BODY_FONT, fontSize: 17, fontWeight: '700', color: COLORS.ink },
  buttonDisabled: { opacity: 0.62 },
  infoBox: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.mist, borderRadius: 14, padding: 14, marginTop: 22 },
  infoText: { flex: 1, fontFamily: BODY_FONT, fontSize: 13, lineHeight: 19, color: '#425E70' },
  backButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingHorizontal: 12 },
  backButtonText: { fontFamily: BODY_FONT, fontSize: 15, fontWeight: '700', color: COLORS.ocean },
});
