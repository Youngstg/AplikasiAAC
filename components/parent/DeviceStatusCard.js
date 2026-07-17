import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DeviceStatusCard({ deviceName, isActive, batteryLevel, alertMessage }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.deviceInfo}>
          <Ionicons name="tablet-portrait-outline" size={24} color="#1a1a1a" />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{deviceName || 'Child Device'}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isActive ? '#4CAF50' : '#9e9e9e' }]} />
              <Text style={styles.statusText}>{isActive ? 'Active' : 'Inactive'}</Text>
              
              {batteryLevel !== null && batteryLevel !== undefined && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Ionicons 
                    name={batteryLevel > 20 ? "battery-full" : "battery-dead"} 
                    size={14} 
                    color={batteryLevel > 20 ? "#4CAF50" : "#F44336"} 
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.statusText}>{batteryLevel}%</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </View>

      {alertMessage && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={20} color="#D32F2F" />
          <Text style={styles.alertText}>{alertMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
      }
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    fontSize: 14,
    color: '#ccc',
    marginHorizontal: 8,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE', // Faded red/pink
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  alertText: {
    color: '#D32F2F',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
});
