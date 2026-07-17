import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function MenuCard({ title, iconName, items, backgroundColor, onPress }) {
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
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Feather name={iconName} size={isSmallDevice ? 32 : 56} color="#1a1a1a" />
        </View>
        
        <Text style={[styles.title, { fontSize: isSmallDevice ? 18 : 26 }]}>
          {title}
        </Text>
        
        <Text style={[styles.subtitle, { fontSize: isSmallDevice ? 12 : 16 }]} numberOfLines={2}>
          {subtitleText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '46%', 
    maxWidth: 350, // Ditingkatkan agar kotak bisa membesar
    aspectRatio: 1, // Memastikan kotak berbentuk persegi
    borderRadius: 12,
    padding: 16,
    margin: 8,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
