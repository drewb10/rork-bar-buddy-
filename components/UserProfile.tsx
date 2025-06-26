import React from 'react';
import { StyleSheet, View, Text, Pressable, Alert, Image } from 'react-native';
import { LogOut, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useRouter } from 'expo-router';

export default function UserProfile() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { user, signOut } = useAuthStore();
  const { profile } = useUserProfileStore();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your stats and progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/sign-in');
          }
        }
      ]
    );
  };

  if (!user && !profile) return null;

  const displayProfile = profile || user;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card }]}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {displayProfile?.profile_picture ? (
            <Image source={{ uri: displayProfile.profile_picture }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: themeColors.primary }]}>
              <User size={24} color="white" />
            </View>
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: themeColors.text }]}>
            {displayProfile?.username || 'User'}
          </Text>
          <Text style={[styles.userUsername, { color: themeColors.primary }]}>
            @{displayProfile?.username || 'user'}
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
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    fontWeight: '500',
  },
  signOutButton: {
    padding: 8,
  },
});