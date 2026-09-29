import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NotificationIndicator = ({
  visible,
  title = 'Pesan baru',
  message = '',
  onPress,
  onClose,
  duration = 4000,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -120, duration: 260, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      if (onClose) onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(hideNotification, duration);
      return () => clearTimeout(timer);
    }
    hideNotification();
  }, [visible, duration]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { top: Math.max(insets.top, 12) + 8, transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}
      accessibilityLiveRegion="polite"
    >
      <TouchableOpacity
        style={styles.notification}
        onPress={onPress}
        activeOpacity={0.86}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${message}`}
        accessibilityHint="Ketuk untuk menandai pesan sudah dibaca"
      >
        <View style={styles.iconContainer} accessibilityElementsHidden>
          <Feather name="message-circle" size={22} color="#176B87" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.eyebrow}>PESAN MASUK</Text>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={(event) => {
            event.stopPropagation?.();
            hideNotification();
          }}
          accessibilityRole="button"
          accessibilityLabel="Tutup notifikasi"
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Feather name="x" size={20} color="#557086" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 16, right: 16, zIndex: 1000, elevation: 1000, alignItems: 'center' },
  notification: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDE6E3',
    borderLeftWidth: 5,
    borderLeftColor: '#64CCC5',
    ...Platform.select({
      ios: { shadowColor: '#17324D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 18 },
      android: { elevation: 8 },
      web: { boxShadow: '0 12px 30px rgba(23, 50, 77, 0.18)' },
    }),
  },
  iconContainer: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#EDF8F7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  textContainer: { flex: 1 },
  eyebrow: { fontSize: 9, letterSpacing: 1, color: '#176B87', fontWeight: '800', marginBottom: 2 },
  title: { fontSize: 15, lineHeight: 19, fontWeight: '700', color: '#17324D', fontFamily: Platform.OS === 'ios' ? 'Trebuchet MS' : 'sans-serif' },
  message: { fontSize: 13, color: '#557086', lineHeight: 18, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Trebuchet MS' : 'sans-serif' },
  closeButton: { width: 40, height: 40, marginLeft: 4, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
});

export default NotificationIndicator;
