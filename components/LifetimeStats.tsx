import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

const { width: screenWidth } = Dimensions.get('window');

interface LifetimeStatsProps {
  stats?: {
    barsHit?: number;
    nightsOut?: number;
    totalBeers?: number;
    totalShots?: number;
    totalPoolGames?: number;
    totalDartGames?: number;
    avgDrunkScale?: number;
  };
}

const LifetimeStats: React.FC<LifetimeStatsProps> = ({ stats }) => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  // Provide default values to prevent crashes
  const safeStats = {
    barsHit: stats?.barsHit || 0,
    nightsOut: stats?.nightsOut || 0,
    totalBeers: stats?.totalBeers || 0,
    totalShots: stats?.totalShots || 0,
    totalPoolGames: stats?.totalPoolGames || 0,
    totalDartGames: stats?.totalDartGames || 0,
    avgDrunkScale: stats?.avgDrunkScale || 0,
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    size = 'normal',
    gradient = ['#FF6B35', '#FF8F65'],
    icon = '📊'
  }: { 
    title: string; 
    value: number | string; 
    subtitle?: string; 
    size?: 'normal' | 'large';
    gradient?: string[];
    icon?: string;
  }) => {
    // Safely format the value
    const formatValue = (val: number | string) => {
      if (typeof val === 'number') {
        if (isNaN(val)) return '0';
        return val.toLocaleString();
      }
      return String(val);
    };

    return (
      <LinearGradient
        colors={size === 'large' ? gradient : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={[
          styles.statCard, 
          size === 'large' && styles.largeStatCard
        ]}
      >
        {/* Glass morphism overlay */}
        <View style={[styles.glassOverlay, size === 'large' && styles.largeGlassOverlay]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>{icon}</Text>
            {size === 'large' && (
              <View style={[styles.primaryIndicator, { backgroundColor: '#FFFFFF30' }]} />
            )}
          </View>
          
          <Text style={[
            styles.statValue, 
            { color: size === 'large' ? '#FFFFFF' : themeColors.primary }, 
            size === 'large' && styles.largeStatValue
          ]}>
            {formatValue(value)}
          </Text>
          
          <Text style={[
            styles.statTitle, 
            { color: size === 'large' ? 'rgba(255, 255, 255, 0.9)' : themeColors.text }
          ]}>
            {title}
          </Text>
          
          {subtitle && (
            <Text style={[
              styles.statSubtitle, 
              { color: size === 'large' ? 'rgba(255, 255, 255, 0.7)' : themeColors.subtext }
            ]}>
              {subtitle}
            </Text>
          )}
        </View>
      </LinearGradient>
    );
  };

  if (!stats && !safeStats) {
    return (
      <View style={styles.container}>
        <View style={[styles.errorCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.errorText, { color: themeColors.subtext }]}>
            No stats available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* First Row - Main Stats */}
      <View style={styles.statsRow}>
        <StatCard 
          title="Bars Hit" 
          value={safeStats.barsHit}
          size="large"
        />
        <StatCard 
          title="Nights Out" 
          value={safeStats.nightsOut}
          subtitle="Days with stats"
          size="large"
        />
      </View>

      {/* Second Row - Drink Stats */}
      <View style={styles.statsRow}>
        <StatCard 
          title="Total Beers" 
          value={safeStats.totalBeers}
        />
        <StatCard 
          title="Total Shots" 
          value={safeStats.totalShots}
        />
      </View>

      {/* Third Row - Game Stats */}
      <View style={styles.statsRow}>
        <StatCard 
          title="Pool Games" 
          value={safeStats.totalPoolGames}
        />
        <StatCard 
          title="Dart Games" 
          value={safeStats.totalDartGames}
        />
      </View>

      {/* Fourth Row - Drunk Scale */}
      <View style={styles.statsRow}>
        <StatCard 
          title="Drunk Scale" 
          value={safeStats.avgDrunkScale.toFixed(1)}
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
  errorCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LifetimeStats;
