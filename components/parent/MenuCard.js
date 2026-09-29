import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function MenuCard({ title, iconName, items, backgroundColor, onPress }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const subtitleText = items ? items.join(' • ') : '';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitleText}`}
      accessibilityHint="Ketuk untuk membuka menu ini"
    >
      <View style={[styles.iconContainer, isCompact && styles.iconContainerCompact]}>
        <Feather name={iconName} size={isCompact ? 23 : 27} color="#17324D" />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, isCompact && styles.titleCompact]}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{subtitleText}</Text>
      </View>
      <View style={styles.arrowContainer} accessibilityElementsHidden>
        <Feather name="arrow-up-right" size={18} color="#17324D" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 142,
    minHeight: 166,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 50, 77, 0.09)',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#17324D',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 8px 22px rgba(23, 50, 77, 0.10)' },
    }),
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerCompact: {
    width: 44,
    height: 44,
    borderRadius: 15,
  },
  textContainer: {
    marginTop: 22,
  },
  title: {
    color: '#17324D',
    fontFamily: Platform.OS === 'ios' ? 'Trebuchet MS' : 'sans-serif',
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '700',
    marginBottom: 6,
  },
  titleCompact: { fontSize: 17 },
  subtitle: {
    color: '#36566E',
    fontFamily: Platform.OS === 'ios' ? 'Trebuchet MS' : 'sans-serif',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  arrowContainer: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
