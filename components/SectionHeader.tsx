import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export default function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      {onSeeAll && (
        <Pressable style={styles.seeAllButton} onPress={onSeeAll}>
          <Text style={[styles.seeAllText, { color: themeColors.primary }]}>
            See All
          </Text>
          <ChevronRight size={16} color={themeColors.primary} />
        </Pressable>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
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