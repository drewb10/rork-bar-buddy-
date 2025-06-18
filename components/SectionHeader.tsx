import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  centered?: boolean;
  showSeeAll?: boolean;
}

export default function SectionHeader({ 
  title, 
  onSeeAll, 
  centered = false,
  showSeeAll = true 
}: SectionHeaderProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <View style={[
      styles.container,
      centered && styles.centeredContainer
    ]}>
      <Text style={[
        styles.title, 
        { color: centered ? themeColors.primary : themeColors.text },
        centered && styles.centeredTitle
      ]}>
        {title}
      </Text>
      {showSeeAll && onSeeAll && (
        <View style={styles.seeAllButton}>
          <Text style={[styles.seeAllText, { color: themeColors.primary }]}>
            See All
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  centeredContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  centeredTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 2,
  },
});