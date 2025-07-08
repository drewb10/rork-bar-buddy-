import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

interface LifetimeStatsProps {
  stats: {
    barsHit: number;
    nightsOut: number;
    totalBeers: number;
    totalShots: number;
    totalPoolGames: number;
    totalDartGames: number;
    avgDrunkScale: number;
  };
}

const LifetimeStats: React.FC<LifetimeStatsProps> = ({ stats }) => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    size = 'normal' 
  }: { 
    title: string; 
    value: number | string; 
    subtitle?: string; 
    size?: 'normal' | 'large';
  }) => (
    <View style={[
      styles.statCard, 
      { backgroundColor: themeColors.card },
      size === 'large' && styles.largeStatCard
    ]}>
      <Text style={[styles.statValue, { color: themeColors.primary }, size === 'large' && styles.largeStatValue]}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text style={[styles.statTitle, { color: themeColors.text }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: themeColors.subtext }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* First Row - Main Stats */}
      <View style={styles.statsRow}>
        <StatCard 
          title="Bars Hit" 
          value={stats.barsHit}
          size="large"
        />
        <StatCard 
          title="Nights Out" 
          value={stats.nightsOut}
          subtitle="Days with stats"
          size="large"
        />
      </View>

      {/* Second Row - Drink Stats */}
      <View style={styles.statsRow}>
        <StatCard 
          title="Total Beers" 
          value={stats.totalBeers}
        />
        <StatCard 
          title="Total Shots" 
          value={stats.totalShots}
        />
      </View>

      {/* Third Row - Game Stats */}
      <View style={styles.statsRow}>
        <StatCard 
          title="Pool Games" 
          value={stats.totalPoolGames}
        />
        <StatCard 
          title="Dart Games" 
          value={stats.totalDartGames}
        />
      </View>

      {/* Fourth Row - Drunk Scale */}
      <View style={styles.statsRow}>
        <StatCard 
          title="Drunk Scale" 
          value={stats.avgDrunkScale}
          subtitle="Average rating"
          size="large"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  largeStatCard: {
    padding: 20,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  largeStatValue: {
    fontSize: 32,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default LifetimeStats;
