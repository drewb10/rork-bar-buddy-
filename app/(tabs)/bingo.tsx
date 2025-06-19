import React from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import BingoCard from '@/components/BingoCard';

export default function BingoScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: '#121212' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.content}>
        <BingoCard />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
});