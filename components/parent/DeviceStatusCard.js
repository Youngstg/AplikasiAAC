import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DeviceStatusCard({ deviceName, isActive, batteryLevel, alertMessage }) {
  const hasBattery = batteryLevel !== null && batteryLevel !== undefined;
  const batteryLow = hasBattery && batteryLevel <= 20;
  const batteryIcon = batteryLow ? 'battery-dead-outline' : 'battery-full-outline';

  return (
    <View style={styles.container} accessibilityLabel={`Status perangkat ${deviceName || 'anak'}`}>
      <View style={styles.eyebrowRow}>
        <Text style={styles.eyebrow}>PERANGKAT TERHUBUNG</Text>
        <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <View style={[styles.statusDot, isActive ? styles.activeDot : styles.inactiveDot]} />
          <Text style={[styles.statusBadgeText, isActive ? styles.activeText : styles.inactiveText]}>
            {isActive ? 'Aktif' : 'Tidak aktif'}
          </Text>
        </View>
      </View>

      <View style={styles.deviceRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="tablet-portrait-outline" size={27} color="#176B87" />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.title} numberOfLines={1}>{deviceName || 'Perangkat anak'}</Text>
          <Text style={styles.helperText}>
            {isActive ? 'Siap menerima pembaruan komunikasi' : 'Hubungkan perangkat anak untuk memulai'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />
      <View style={styles.metricRow}>
        <View style={styles.metricLabelRow}>
          <Ionicons name={batteryIcon} size={19} color={batteryLow ? '#C84C4C' : '#25855A'} />
          <Text style={styles.metricLabel}>Daya baterai</Text>
        </View>
        <Text style={[styles.metricValue, batteryLow && styles.lowBatteryText]}>
          {hasBattery ? `${batteryLevel}%` : 'Belum tersedia'}
        </Text>
      </View>

      {alertMessage && (
        <View style={styles.alertBanner} accessibilityRole="alert">
          <Ionicons name="warning-outline" size={20} color="#C84C4C" />
          <Text style={styles.alertText}>{alertMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#DCEBEA',
    ...Platform.select({
      ios: {
        shadowColor: '#17324D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 10px 28px rgba(23, 50, 77, 0.08)' },
    }),
  },
  eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  eyebrow: {
    flex: 1,
    color: '#176B87',
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Trebuchet MS' : 'sans-serif',
  },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  activeBadge: { backgroundColor: '#E4F5EC' },
  inactiveBadge: { backgroundColor: '#FCEAEA' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  activeDot: { backgroundColor: '#25855A' },
  inactiveDot: { backgroundColor: '#C84C4C' },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  activeText: { color: '#25855A' },
  inactiveText: { color: '#C84C4C' },
  deviceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  iconContainer: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#EDF8F7', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  deviceInfo: { flex: 1 },
  title: { color: '#17324D', fontSize: 20, lineHeight: 25, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Trebuchet MS' : 'sans-serif' },
  helperText: { color: '#557086', fontSize: 12, lineHeight: 17, marginTop: 3, fontFamily: Platform.OS === 'ios' ? 'Trebuchet MS' : 'sans-serif' },
  divider: { height: 1, backgroundColor: '#E3EFEE', marginVertical: 17 },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricLabel: { color: '#557086', fontSize: 13, fontWeight: '600' },
  metricValue: { color: '#25855A', fontSize: 13, fontWeight: '800' },
  lowBatteryText: { color: '#C84C4C' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCEAEA', padding: 12, borderRadius: 12, marginTop: 16 },
  alertText: { color: '#A83B3B', fontWeight: '600', marginLeft: 8, flex: 1, lineHeight: 18 },
});
