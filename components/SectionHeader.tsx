import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onViewAll?: () => void;
  centered?: boolean;
  showSeeAll?: boolean;
}

export default function SectionHeader({ 
  title,
  subtitle,
  icon,
  onViewAll, 
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
      <View style={styles.leftContent}>
        <View style={styles.titleRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[
            styles.title, 
            { color: centered ? themeColors.primary : themeColors.text },
            centered && styles.centeredTitle
          ]}>
            {title}
          </Text>
        </View>
        {subtitle && (
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {showSeeAll && onViewAll && !centered && (
        <Pressable style={styles.seeAllButton} onPress={onViewAll}>
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
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  centeredTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
    lineHeight: 18,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 2,
  },
});