import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, TextInput, ScrollView, Alert, Image } from 'react-native';
import { X, Search, UserPlus, Users, Award, TrendingUp, MapPin, Check, UserX } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

interface Friend {
  id: string;
  username: string;
  email: string;
  xp: number;
  nights_out: number;
  bars_hit: number;
  profile_picture?: string;
}

interface FriendRequest {
  id: string;
  from_user_id: string;
  from_username: string;
  from_user_rank: string;
  created_at: string;
}

interface FriendsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FriendsModal({ visible, onClose }: FriendsModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  useEffect(() => {
    if (visible) {
      loadFriends();
      loadFriendRequests();
    }
  }, [visible]);

  const loadFriends = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          friend_id,
          profiles!friends_friend_id_fkey (
            id,
            username,
            email,
            xp,
            nights_out,
            bars_hit,
            profile_picture
          )
        `)
        .eq('user_id', profile.id);

      if (error) {
        console.error('Error loading friends:', error);
        return;
      }

      const friendsList = (data?.map(item => item.profiles).filter(Boolean) || []).flat();
      setFriends(friendsList as unknown as Friend[]);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          from_user_id,
          created_at,
          from_user:profiles!friend_requests_from_user_id_fkey(username, xp)
        `)
        .eq('to_user_id', profile.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error loading friend requests:', error);
        return;
      }

      const requests: FriendRequest[] = (data || []).map((request: any) => {
        const rankInfo = getRankByXP(request.from_user?.xp || 0);
        return {
          id: request.id,
          from_user_id: request.from_user_id,
          from_username: request.from_user?.username || 'Unknown',
          from_user_rank: rankInfo.title,
          created_at: request.created_at,
        };
      });

      setFriendRequests(requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !profile) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, xp, nights_out, bars_hit, profile_picture')
        .ilike('username', `%${searchQuery.trim()}%`)
        .neq('id', profile.id)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        Alert.alert('Error', 'Failed to search users');
        return;
      }

      // Filter out users who are already friends
      const friendIds = friends.map(f => f.id);
      const filteredResults = data.filter(user => !friendIds.includes(user.id));
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    if (!profile) return;

    try {
      // Check if request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('friend_requests')
        .select('id')
        .or(`and(from_user_id.eq.${profile.id},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${profile.id})`)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing request:', checkError);
        Alert.alert('Error', 'Failed to send friend request');
        return;
      }

      if (existingRequest) {
        Alert.alert('Request Exists', 'A friend request already exists between you and this user');
        return;
      }

      // Send friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: profile.id,
          to_user_id: userId,
        });

      if (error) {
        console.error('Error sending friend request:', error);
        Alert.alert('Error', 'Failed to send friend request');
        return;
      }

      Alert.alert('Success', 'Friend request sent successfully');
      
      // Remove user from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requestId: string, fromUserId: string) => {
    if (!profile) return;

    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ 
          status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating friend request:', updateError);
        Alert.alert('Error', 'Failed to accept friend request');
        return;
      }

      // Create friendship (both directions)
      const { error: friendError } = await supabase
        .from('friends')
        .insert([
          { user_id: profile.id, friend_id: fromUserId },
          { user_id: fromUserId, friend_id: profile.id }
        ]);

      if (friendError) {
        console.error('Error creating friendship:', friendError);
        Alert.alert('Error', 'Failed to create friendship');
        return;
      }

      Alert.alert('Success', 'Friend request accepted');
      
      // Refresh data
      loadFriends();
      loadFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ 
          status: 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error declining friend request:', error);
        Alert.alert('Error', 'Failed to decline friend request');
        return;
      }

      Alert.alert('Success', 'Friend request declined');
      loadFriendRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request');
    }
  };

  const getRankByXP = (xp: number) => {
    if (xp < 126) return { title: 'Sober Star', color: '#4CAF50' };
    if (xp < 501) return { title: 'Sober Star', color: '#4CAF50' };
    if (xp < 1001) return { title: 'Buzzed Beginner', color: '#FFC107' };
    if (xp < 1501) return { title: 'Tipsy Talent', color: '#FF9800' };
    if (xp < 2001) return { title: 'Big Chocolate', color: '#FF5722' };
    return { title: 'Scoop & Score Champ', color: '#9C27B0' };
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
              Friends ({friends.length})
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
              Requests ({friendRequests.length})
            </Text>
          </Pressable>
          <Pressable 
            style={[
              styles.tab, 
              activeTab === 'search' && { backgroundColor: themeColors.primary }
            ]}
            onPress={() => setActiveTab('search')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'search' ? 'white' : themeColors.subtext }
            ]}>
              Search
            </Text>
          </Pressable>
        </View>

        {activeTab === 'friends' ? (
          <View style={styles.friendsSection}>
            {friends.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
                <Users size={48} color={themeColors.subtext} />
                <Text style={[styles.emptyStateText, { color: themeColors.subtext }]}>
                  No friends yet. Add some friends to see their stats!
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
                {friends.map((friend) => (
                  <View key={friend.id} style={[styles.friendCard, { backgroundColor: themeColors.card }]}>
                    <View style={styles.friendHeader}>
                      <View style={styles.friendInfo}>
                        {friend.profile_picture ? (
                          <Image source={{ uri: friend.profile_picture }} style={styles.friendAvatar} />
                        ) : (
                          <View style={[styles.friendAvatarPlaceholder, { backgroundColor: themeColors.primary }]}>
                            <Text style={styles.friendAvatarText}>
                              {friend.username.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.friendDetails}>
                          <Text style={[styles.friendName, { color: themeColors.text }]}>
                            @{friend.username}
                          </Text>
                          <Text style={[styles.friendEmail, { color: themeColors.subtext }]}>
                            {friend.email}
                          </Text>
                          <Text style={[styles.rankText, { color: getRankByXP(friend.xp).color }]}>
                            {getRankByXP(friend.xp).title}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.friendStats}>
                      <View style={styles.statItem}>
                        <TrendingUp size={16} color={themeColors.primary} />
                        <Text style={[styles.statValue, { color: themeColors.text }]}>
                          {friend.nights_out}
                        </Text>
                        <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                          Nights
                        </Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <MapPin size={16} color={themeColors.primary} />
                        <Text style={[styles.statValue, { color: themeColors.text }]}>
                          {friend.bars_hit}
                        </Text>
                        <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                          Bars
                        </Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <Award size={16} color={themeColors.primary} />
                        <Text style={[styles.statValue, { color: themeColors.text }]}>
                          {friend.xp}
                        </Text>
                        <Text style={[styles.statLabel, { color: themeColors.subtext }]}>
                          XP
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        ) : activeTab === 'requests' ? (
          <View style={styles.friendsSection}>
            {friendRequests.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
                <UserPlus size={48} color={themeColors.subtext} />
                <Text style={[styles.emptyStateText, { color: themeColors.subtext }]}>
                  No pending friend requests.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
                {friendRequests.map((request) => (
                  <View key={request.id} style={[styles.requestCard, { backgroundColor: themeColors.card }]}>
                    <View style={styles.requestHeader}>
                      <View style={styles.friendInfo}>
                        <View style={[styles.friendAvatarPlaceholder, { backgroundColor: themeColors.primary }]}>
                          <Text style={styles.friendAvatarText}>
                            {request.from_username.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.friendDetails}>
                          <Text style={[styles.friendName, { color: themeColors.text }]}>
                            @{request.from_username}
                          </Text>
                          <Text style={[styles.rankText, { color: themeColors.primary }]}>
                            {request.from_user_rank}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.requestActions}>
                      <Pressable 
                        style={[styles.requestButton, styles.acceptButton]}
                        onPress={() => acceptFriendRequest(request.id, request.from_user_id)}
                      >
                        <Check size={16} color="white" />
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </Pressable>
                      
                      <Pressable 
                        style={[styles.requestButton, styles.declineButton]}
                        onPress={() => declineFriendRequest(request.id)}
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
        ) : (
          <View style={styles.searchSection}>
            <View style={[styles.searchContainer, { backgroundColor: themeColors.card }]}>
              <TextInput
                style={[styles.searchInput, { 
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: themeColors.border
                }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by username"
                placeholderTextColor={themeColors.subtext}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable 
                style={[styles.searchButton, { backgroundColor: themeColors.primary }]}
                onPress={searchUsers}
                disabled={isSearching}
              >
                {isSearching ? (
                  <Text style={styles.searchButtonText}>...</Text>
                ) : (
                  <Search size={20} color="white" />
                )}
              </Pressable>
            </View>

            <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
              {searchResults.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
                  <Search size={48} color={themeColors.subtext} />
                  <Text style={[styles.emptyStateText, { color: themeColors.subtext }]}>
                    {searchQuery ? 'No users found. Try a different search.' : 'Search for users by username.'}
                  </Text>
                </View>
              ) : (
                searchResults.map((user) => (
                  <View key={user.id} style={[styles.searchResultCard, { backgroundColor: themeColors.card }]}>
                    <View style={styles.friendInfo}>
                      {user.profile_picture ? (
                        <Image source={{ uri: user.profile_picture }} style={styles.friendAvatar} />
                      ) : (
                        <View style={[styles.friendAvatarPlaceholder, { backgroundColor: themeColors.primary }]}>
                          <Text style={styles.friendAvatarText}>
                            {user.username.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.friendDetails}>
                        <Text style={[styles.friendName, { color: themeColors.text }]}>
                          @{user.username}
                        </Text>
                        <Text style={[styles.rankText, { color: getRankByXP(user.xp).color }]}>
                          {getRankByXP(user.xp).title}
                        </Text>
                      </View>
                    </View>
                    
                    <Pressable 
                      style={[styles.addButton, { backgroundColor: themeColors.primary }]}
                      onPress={() => sendFriendRequest(user.id)}
                    >
                      <UserPlus size={16} color="white" />
                      <Text style={styles.addButtonText}>Add</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
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
  friendEmail: {
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
  searchSection: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
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
  searchResults: {
    flex: 1,
  },
  searchResultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});