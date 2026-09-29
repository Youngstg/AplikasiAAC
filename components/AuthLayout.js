import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  ink: '#17324D',
  ocean: '#176B87',
  aqua: '#64CCC5',
  sun: '#FFCF5C',
  mist: '#EDF8F7',
  white: '#FFFFFF',
};

export default function AuthLayout({ children, hideCircles = false }) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 640 || height < 700;

  return (
    <LinearGradient
      colors={[COLORS.mist, COLORS.white]}
      locations={[0, 0.82]}
      style={styles.container}
    >
      {!hideCircles && (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <View style={[styles.shape, styles.aquaShape, isCompact && styles.aquaShapeCompact]} />
          <View style={[styles.shape, styles.sunShape, isCompact && styles.sunShapeCompact]} />
          {!isCompact && <View style={[styles.shape, styles.oceanShape]} />}
        </View>
      )}
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.mist,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  shape: {
    position: 'absolute',
    borderRadius: 999,
  },
  aquaShape: {
    width: 340,
    height: 340,
    top: -170,
    right: -80,
    backgroundColor: COLORS.aqua,
    opacity: 0.28,
  },
  aquaShapeCompact: {
    width: 210,
    height: 210,
    top: -120,
    right: -80,
  },
  sunShape: {
    width: 190,
    height: 190,
    bottom: -78,
    left: -50,
    backgroundColor: COLORS.sun,
    opacity: 0.48,
  },
  sunShapeCompact: {
    width: 130,
    height: 130,
    bottom: -70,
    left: -38,
  },
  oceanShape: {
    width: 120,
    height: 120,
    top: '42%',
    left: -72,
    backgroundColor: COLORS.ocean,
    opacity: 0.12,
  },
});
