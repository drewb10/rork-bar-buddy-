import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';

// Safe import for BarBuddyChatbot
let BarBuddyChatbot: React.ComponentType<any> | null = null;

try {
  BarBuddyChatbot = require('@/components/BarBuddyChatbot').default;
} catch (error) {
  console.warn('BarBuddyChatbot component not found');
}

export default function ChatScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <BarBuddyLogo size="small" />
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Bar Buddy Chat
        </Text>
      </View>

      {/* Chat Component */}
      <View style={styles.chatContainer}>
        {BarBuddyChatbot ? (
          <BarBuddyChatbot />
        ) : (
          <View style={styles.chatPlaceholder}>
            <Text style={styles.chatIcon}>💬</Text>
            <Text style={[styles.placeholderTitle, { color: themeColors.text }]}>
              Chat Loading...
            </Text>
            <Text style={[styles.placeholderText, { color: themeColors.subtext }]}>
              Connect with other bar-goers and share your nightlife experiences!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  chatContainer: {
    flex: 1,
  },
  chatPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  chatIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
