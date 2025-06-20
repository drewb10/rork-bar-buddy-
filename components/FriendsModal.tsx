import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, TextInput, ScrollView, Alert, Image } from 'react-native';
import { X, Search, UserPlus, Users, Award, TrendingUp, MapPin, Check, UserX } from 'lucide-react-native';
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
  const { 
    profile, 
    sendFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest,
    loadFriendRequests 
  } = useUserProfileStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  useEffect(() => {
    if (visible) {
      loadFriendRequests();
    }
  }, [visible, loadFriendRequests]);

  const handleSendFriendRequest = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a User ID to search.');
      return;
    }

    if (!searchQuery.startsWith('#')) {
      Alert.alert('Error', 'User ID must start with #');
      return;
    }

    if (searchQuery === profile.userId) {
      Alert.alert('Error', 'You cannot add yourself as a friend.');
      return;
    }

    setIsSearching(true);
    const success = await sendFriendRequest(searchQuery.trim());
    setIsSearching(false);

    if (success) {
      Alert.alert('Success', 'Friend request sent successfully!');
      setSearchQuery('');
    } else {
      Alert.alert('Error', 'User not found, already friends, or request already sent.');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    const success = await acceptFriendRequest(requestId);
    if (success) {
      Alert.alert('Success', 'Friend request accepted!');
    } else {
      Alert.alert('Error', 'Failed to accept friend request.');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const success = await declineFriendRequest(requestId);
    if (success) {
      Alert.alert('Request Declined', 'Friend request has been declined.');
    } else {
      Alert.alert('Error', 'Failed to decline friend request.');
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

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <Pressable 
            style={[
              styles.tab, 
              activeTab === 'friends' && { backgroundColor: themeColors.primary }
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'friends' ? 'white' : themeColors.subtext }
            ]}>
              Friends ({profile.friends.length})
            </Text>
          </Pressable>
          <Pressable 
            style={[
              styles.tab, 
              activeTab === 'requests' && { backgroundColor: themeColors.primary }
            ]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'requests' ? 'white' : themeColors.subtext }
            ]}>
              Requests ({profile.friendRequests.length})
            </Text>
          </Pressable>
        </View>

        {activeTab === 'friends' ? (
          <>
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
                  onPress={handleSendFriendRequest}
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
                        <View style={styles.friendInfo}>
                          {friend.profilePicture ? (
                            <Image source={{ uri: friend.profilePicture }} style={styles.friendAvatar} />
                          ) : (
                            <View style={[styles.friendAvatarPlaceholder, { backgroundColor: themeColors.primary }]}>
                              <Text style={styles.friendAvatarText}>
                                {friend.name.charAt(0)}
                              </Text>
                            </View>
                          )}
                          <View style={styles.friendDetails}>
                            <Text style={[styles.friendName, { color: themeColors.text }]}>
                              {friend.name}
                            </Text>
                            <Text style={[styles.friendId, { color: themeColors.subtext }]}>
                              {friend.userId}
                            </Text>
                          </View>
                        </View>
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
          </>
        ) : (
          /* Friend Requests Tab */
          <View style={styles.friendsSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Friend Requests ({profile.friendRequests.length})
            </Text>
            
            {profile.friendRequests.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
                <UserPlus size={48} color={themeColors.subtext} />
                <Text style={[styles.emptyStateText, { color: themeColors.subtext }]}>
                  No pending friend requests.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
                {profile.friendRequests.map((request) => (
                  <View key={request.id} style={[styles.requestCard, { backgroundColor: themeColors.card }]}>
                    <View style={styles.requestHeader}>
                      <View style={styles.friendInfo}>
                        {request.fromUserProfilePicture ? (
                          <Image source={{ uri: request.fromUserProfilePicture }} style={styles.friendAvatar} />
                        ) : (
                          <View style={[styles.friendAvatarPlaceholder, { backgroundColor: themeColors.primary }]}>
                            <Text style={styles.friendAvatarText}>
                              {request.fromUserName.charAt(0)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.friendDetails}>
                          <Text style={[styles.friendName, { color: themeColors.text }]}>
                            {request.fromUserName}
                          </Text>
                          <Text style={[styles.friendId, { color: themeColors.subtext }]}>
                            {request.fromUserId}
                          </Text>
                          <Text style={[styles.rankText, { color: themeColors.primary }]}>
                            {request.fromUserRank}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.requestActions}>
                      <Pressable 
                        style={[styles.requestButton, styles.acceptButton]}
                        onPress={() => handleAcceptRequest(request.id)}
                      >
                        <Check size={16} color="white" />
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </Pressable>
                      
                      <Pressable 
                        style={[styles.requestButton, styles.declineButton]}
                        onPress={() => handleDeclineRequest(request.id)}
                      >
                        <UserX size={16} color="white" />
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
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
  requestCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  friendHeader: {
    marginBottom: 12,
  },
  requestHeader: {
    marginBottom: 16,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendId: {
    fontSize: 12,
    marginBottom: 2,
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
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  requestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#FF4444',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});