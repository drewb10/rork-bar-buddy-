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
        colors={(size === 'large' ? gradient : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']) as [string, string, ...string[]]}
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
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    opacity: 0.8,
  },
  heroRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  gridContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  largeStatCard: {
    minHeight: 140,
  },
  glassOverlay: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)', // This works on iOS
  },
  largeGlassOverlay: {
    paddingVertical: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 28,
  },
  primaryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 6,
    fontVariant: ['tabular-nums'], // Monospace numbers for better alignment
  },
  largeStatValue: {
    fontSize: 40,
    letterSpacing: -1.5,
  },
  statTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'left',
  },
  statSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginTop: 4,
    textAlign: 'left',
  },
  drunkScaleCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  drunkScaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  drunkScaleIcon: {
    fontSize: 32,
  },
  drunkScaleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  drunkScaleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  drunkScaleValue: {
    color: 'white',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -2,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  drunkScaleTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  drunkScaleBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  drunkScaleFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  drunkScaleSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  footer: {
    height: 40,
  },
  errorCard: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LifetimeStats;
