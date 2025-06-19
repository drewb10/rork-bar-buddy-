import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { X, Search, UserPlus, Users, Award, TrendingUp, MapPin } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';

interface FriendsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FriendsModal({ visible, onClose }: FriendsModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile, addFriend } = useUserProfileStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleAddFriend = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a User ID to search.');
      return;
    }

    if (!searchQuery.startsWith('#')) {
      Alert.alert('Error', 'User ID must start with #');
      return;
    }

    setIsSearching(true);
    const success = await addFriend(searchQuery.trim());
    setIsSearching(false);

    if (success) {
      Alert.alert('Success', 'Friend added successfully!');
      setSearchQuery('');
    } else {
      Alert.alert('Error', 'User not found or already in your friends list.');
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Friends
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={24} color={themeColors.subtext} />
          </Pressable>
        </View>

        {/* Your User ID */}
        <View style={[styles.userIdCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.userIdLabel, { color: themeColors.subtext }]}>
            Your User ID:
          </Text>
          <Text style={[styles.userId, { color: themeColors.primary }]}>
            {profile.userId}
          </Text>
          <Text style={[styles.userIdHint, { color: themeColors.subtext }]}>
            Share this with friends to connect!
          </Text>
        </View>

        {/* Add Friend */}
        <View style={[styles.searchSection, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Add Friend
          </Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { 
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: themeColors.border
              }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Enter User ID (e.g., #JohnDoe12345)"
              placeholderTextColor={themeColors.subtext}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable 
              style={[styles.searchButton, { backgroundColor: themeColors.primary }]}
              onPress={handleAddFriend}
              disabled={isSearching}
            >
              {isSearching ? (
                <Text style={styles.searchButtonText}>...</Text>
              ) : (
                <UserPlus size={20} color="white" />
              )}
            </Pressable>
          </View>
        </View>

        {/* Friends List */}
        <View style={styles.friendsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Your Friends ({profile.friends.length})
          </Text>
          
          {profile.friends.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
              <Users size={48} color={themeColors.subtext} />
              <Text style={[styles.emptyStateText, { color: themeColors.subtext }]}>
                No friends yet. Add some friends to see their stats!
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
              {profile.friends.map((friend) => (
                <View key={friend.userId} style={[styles.friendCard, { backgroundColor: themeColors.card }]}>
                  <View style={styles.friendHeader}>
                    <Text style={[styles.friendName, { color: themeColors.text }]}>
                      {friend.name}
                    </Text>
                    <Text style={[styles.friendId, { color: themeColors.subtext }]}>
                      {friend.userId}
                    </Text>
                  </View>
                  
                  <View style={styles.friendStats}>
                    <View style={styles.statItem}>
                      <TrendingUp size={16} color={themeColors.primary} />
                      <Text style={[styles.statValue, { color: themeColors.text }]}>
                        {friend.nightsOut}
                      </Text>
                      <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                        Nights
                      </Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <MapPin size={16} color={themeColors.primary} />
                      <Text style={[styles.statValue, { color: themeColors.text }]}>
                        {friend.barsHit}
                      </Text>
                      <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                        Bars
                      </Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Award size={16} color={themeColors.primary} />
                      <Text style={[styles.rankText, { color: themeColors.primary }]}>
                        {friend.rankTitle}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    width: '95%',
    height: '90%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  userIdCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  userIdLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  userId: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  userIdHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  searchSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  friendsSection: {
    flex: 1,
  },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  friendsList: {
    flex: 1,
  },
  friendCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  friendHeader: {
    marginBottom: 12,
  },
  friendName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendId: {
    fontSize: 14,
  },
  friendStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});