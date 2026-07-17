import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import MenuCard from './MenuCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MenuGrid({ menus }) {
  const { width } = useWindowDimensions();
  
  // Menyesuaikan lebar grid agar proporsional
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
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 800, // Ditingkatkan agar kotak bisa membesar tapi tetap 2x2
    paddingVertical: 20,
    alignSelf: 'center',
  },
});
