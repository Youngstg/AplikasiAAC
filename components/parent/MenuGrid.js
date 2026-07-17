import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import MenuCard from './MenuCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MenuGrid({ menus }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  // Calculate approximate card height to fit without scrolling.
  // totalHeight - (safeArea + DeviceStatusCardHeight + paddings/margins)
  // roughly: DeviceStatusCard ~100px, padding/margin ~60px
  const availableHeight = height - insets.top - insets.bottom - 160; 
  // We want 2 rows, so availableHeight / 2. Cap at 250px so it doesn't get huge on web/tablets.
  const cardHeight = Math.max(160, Math.min(250, Math.floor(availableHeight / 2)));

  return (
    <View style={styles.gridContainer}>
      {menus.map((menu, index) => (
        <MenuCard
          key={index}
          title={menu.title}
          iconName={menu.iconName}
          items={menu.items}
          backgroundColor={menu.backgroundColor}
          onPress={menu.onPress}
          height={cardHeight}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
});
