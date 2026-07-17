import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthLayout({ children, hideCircles = false }) {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 640;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF4D6', '#F5D08C']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Decorative Circles - Hidden or repositioned on small screens */}
      {!isSmallScreen && !hideCircles && (
        <>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
          <View style={[styles.circle, styles.circle4]} />
          <View style={[styles.circle, styles.circle5]} />
        </>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden', // to cut off circles at edges
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.6,
  },
  circle1: {
    width: 400,
    height: 400,
    backgroundColor: '#FFD1DC', // Pastel Pink
    top: -100,
    left: -150,
  },
  circle2: {
    width: 300,
    height: 300,
    backgroundColor: '#E6E6FA', // Lavender
    top: 200,
    right: -100,
  },
  circle3: {
    width: 250,
    height: 250,
    backgroundColor: '#ADD8E6', // Light Blue
    bottom: -50,
    left: 50,
  },
  circle4: {
    width: 350,
    height: 350,
    backgroundColor: '#98FB98', // Pale Green
    bottom: -150,
    right: 150,
  },
  circle5: {
    width: 200,
    height: 200,
    backgroundColor: '#FFA07A', // Light Salmon
    top: -50,
    right: 200,
  },
});
