import React from 'react';
import { View, StyleSheet } from 'react-native';
import MenuCard from './MenuCard';

export default function MenuGrid({ menus }) {
  const rows = [];
  for (let index = 0; index < menus.length; index += 2) {
    rows.push(menus.slice(index, index + 2));
  }

  return (
    <View style={styles.gridContainer}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((menu) => (
            <MenuCard
              key={menu.title}
              title={menu.title}
              iconName={menu.iconName}
              items={menu.items}
              backgroundColor={menu.backgroundColor}
              onPress={menu.onPress}
            />
          ))}
          {row.length === 1 && <View style={styles.placeholder} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  placeholder: { flex: 1 },
});
