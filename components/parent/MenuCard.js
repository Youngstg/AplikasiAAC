import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function MenuCard({ title, iconName, items, backgroundColor, onPress, height }) {
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 380;
  
  // Combine items array into a single string separated by bullet
  const subtitleText = items ? items.join(' • ') : '';

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor,
          height: height,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Feather name={iconName} size={isSmallDevice ? 32 : 40} color="#1a1a1a" />
        </View>
        
        <Text style={[styles.title, { fontSize: isSmallDevice ? 18 : 22 }]}>
          {title}
        </Text>
        
        <Text style={[styles.subtitle, { fontSize: isSmallDevice ? 12 : 14 }]} numberOfLines={2}>
          {subtitleText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%', 
    borderRadius: 24,
    padding: 16,
    marginBottom: '4%',
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
      }
    }),
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#1a1a1a',
    opacity: 0.7,
    textAlign: 'center',
    fontWeight: '500',
  },
});
