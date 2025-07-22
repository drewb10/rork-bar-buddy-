import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import BarBuddyLogo from '@/components/BarBuddyLogo';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <BarBuddyLogo size="large" />
        <ActivityIndicator 
          size="large" 
          color={colors.dark.primary} 
          style={styles.spinner}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 32,
    marginBottom: 16,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});