import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, StatusBar, Platform, Alert } from 'react-native';
import { Camera, RotateCcw } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function CameraScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const handleTakePhoto = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera Not Available', 'Camera functionality is not available in web preview. This feature works on mobile devices.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <BarBuddyLogo size="small" />
          <Text style={[styles.headerTitle, { color: 'white' }]}>
            Capture Your Night
          </Text>
        </View>

        <View style={styles.cameraPlaceholder}>
          <Camera size={64} color={themeColors.primary} />
          <Text style={[styles.placeholderText, { color: 'white' }]}>
            Camera Preview
          </Text>
          <Text style={[styles.placeholderSubtext, { color: themeColors.subtext }]}>
            Take photos at bars and earn XP!
          </Text>
        </View>

        <View style={styles.captureContainer}>
          <Pressable 
            style={[styles.captureButton, { backgroundColor: themeColors.primary }]}
            onPress={handleTakePhoto}
          >
            <Camera size={32} color="white" />
          </Pressable>
        </View>
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
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 16,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  captureContainer: {
    alignItems: 'center',
    paddingBottom: 80,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});