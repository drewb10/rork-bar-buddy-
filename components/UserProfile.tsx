import React from 'react';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { LogOut, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';

export default function UserProfile() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your stats and progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            // This only clears auth data, not user stats
            signOut();
            // Note: User stats persist in AsyncStorage even after logout
          }
        }
      ]
    );
  };

  if (!user) return null;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: themeColors.primary }]}>
          <User size={24} color="white" />
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: themeColors.text }]}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={[styles.userEmail, { color: themeColors.subtext }]}>
            {user.email}
          </Text>
        </View>
      </View>
      
      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={20} color={themeColors.error} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
  },
  signOutButton: {
    padding: 8,
  },
});