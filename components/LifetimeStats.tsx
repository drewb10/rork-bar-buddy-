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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Lifetime Stats
        </Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.subtext }]}>
          Your nightlife achievements
        </Text>
      </View>

      {/* Hero Stats Row - Primary metrics with gradients */}
      <View style={styles.heroRow}>
        <StatCard 
          title="Bars Explored" 
          value={safeStats.barsHit}
          subtitle="Unique venues"
          size="large"
          gradient={['#FF6B35', '#FF8F65']}
          icon="🏛️"
        />
        <StatCard 
          title="Nights Out" 
          value={safeStats.nightsOut}
          subtitle="Epic adventures"
          size="large"
          gradient={['#007AFF', '#40A9FF']}
          icon="🌙"
        />
      </View>

      {/* Secondary Stats Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <StatCard 
            title="Total Beers" 
            value={safeStats.totalBeers}
            icon="🍺"
          />
          <StatCard 
            title="Total Shots" 
            value={safeStats.totalShots}
            icon="🥃"
          />
        </View>

        <View style={styles.gridRow}>
          <StatCard 
            title="Pool Games" 
            value={safeStats.totalPoolGames}
            icon="🎱"
          />
          <StatCard 
            title="Dart Games" 
            value={safeStats.totalDartGames}
            icon="🎯"
          />
        </View>
      </View>

      {/* Drunk Scale Card - Special highlight */}
      <LinearGradient
        colors={['#AF52DE', '#C77DFF']}
        style={styles.drunkScaleCard}
      >
        <View style={styles.glassOverlay}>
          <View style={styles.drunkScaleHeader}>
            <Text style={styles.drunkScaleIcon}>🔥</Text>
            <View style={styles.drunkScaleBadge}>
              <Text style={styles.drunkScaleBadgeText}>AVG</Text>
            </View>
          </View>
          
          <Text style={styles.drunkScaleValue}>
            {safeStats.avgDrunkScale.toFixed(1)}
          </Text>
          
          <Text style={styles.drunkScaleTitle}>
            Drunk Scale Rating
          </Text>
          
          <View style={styles.drunkScaleBar}>
            <View 
              style={[
                styles.drunkScaleFill, 
                { width: `${(safeStats.avgDrunkScale / 10) * 100}%` }
              ]} 
            />
          </View>
          
          <Text style={styles.drunkScaleSubtitle}>
            Out of 10.0
          </Text>
        </View>
      </LinearGradient>

      {/* Footer spacing */}
      <View style={styles.footer} />
    </ScrollView>
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
