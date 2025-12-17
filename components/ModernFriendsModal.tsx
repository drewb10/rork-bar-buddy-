import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { X, Search, Users, UserPlus, Award, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { safeSupabase } from '@/lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

interface Friend {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  profile_picture?: string;
  xp: number;
  level: number;
  bars_hit: number;
  nights_out: number;
  current_rank: string;
  is_active: boolean;
}

interface FriendsModalProps {
  visible: boolean;
  onClose: () => void;
}

const FriendsModal: React.FC<FriendsModalProps> = ({ visible, onClose }) => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'friends' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFriends();
    }
  }, [visible]);

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      
      if (!safeSupabase) {
        // Demo friends data
        const demoFriends: Friend[] = [
          {
            id: '1',
            user_id: 'friend_1',
            username: 'nightowl_87',
            display_name: 'Night Owl',
            xp: 3420,
            level: 4,
            bars_hit: 12,
            nights_out: 8,
            current_rank: 'Buzzed Beginner',
            is_active: true,
          },
          {
            id: '2',
            user_id: 'friend_2',
            username: 'party_king',
            display_name: 'Party King',
            xp: 5180,
            level: 6,
            bars_hit: 18,
            nights_out: 15,
            current_rank: 'Drunk Dynamo',
            is_active: true,
          },
          {
            id: '3',
            user_id: 'friend_3',
            username: 'bar_hopper',
            display_name: 'Bar Hopper',
            xp: 2750,
            level: 3,
            bars_hit: 22,
            nights_out: 6,
            current_rank: 'Tipsy Talent',
            is_active: true,
          },
        ];
        setFriends(demoFriends);
        return;
      }

      // Real Supabase query would go here
      const { data, error } = await safeSupabase
        .from('friends')
        .select(`
          id,
          friend_user_id,
          user_profiles!friends_friend_user_id_fkey (
            user_id,
            username,
            display_name,
            profile_picture,
            xp,
            level,
            bars_hit,
            nights_out,
            current_rank,
            is_active
          )
        `)
        .eq('user_id', profile?.id);

      if (error) {
        console.error('Error loading friends:', error);
        return;
      }

      // Transform the data
      const friendsList = data?.map((item: any) => ({
        id: item.id,
        ...item.user_profiles
      })) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      
      if (!safeSupabase) {
        // Demo search results
        const demoResults: Friend[] = [
          {
            id: 'search_1',
            user_id: 'user_search_1',
            username: 'social_butterfly',
            display_name: 'Social Butterfly',
            xp: 4200,
            level: 5,
            bars_hit: 16,
            nights_out: 12,
            current_rank: 'Buzzed Beginner',
            is_active: true,
          },
          {
            id: 'search_2',
            user_id: 'user_search_2',
            username: 'midnight_rider',
            display_name: 'Midnight Rider',
            xp: 1850,
            level: 2,
            bars_hit: 8,
            nights_out: 5,
            current_rank: 'Tipsy Talent',
            is_active: true,
          },
        ].filter(user => 
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.display_name?.toLowerCase().includes(query.toLowerCase())
        );
        
        setSearchResults(demoResults);
        return;
      }

      const { data, error } = await safeSupabase
        .from('user_profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .neq('user_id', profile?.id)
        .eq('is_active', true)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getRankEmoji = (rank: string) => {
    const rankMap: { [key: string]: string } = {
      'Sober Star': '⭐',
      'Tipsy Talent': '🌟',
      'Buzzed Beginner': '✨',
      'Drunk Dynamo': '🔥',
      'Wasted Warrior': '⚡',
      'Blackout Baron': '👑',
    };
    return rankMap[rank] || '⭐';
  };

  const FriendCard = ({ friend, showAddButton = false }: { friend: Friend; showAddButton?: boolean }) => (
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
      style={styles.friendCard}
    >
      <View style={styles.glassOverlay}>
        <View style={styles.friendHeader}>
          {friend.profile_picture ? (
            <Image source={{ uri: friend.profile_picture }} style={styles.friendAvatar} />
          ) : (
            <View style={[styles.friendAvatarPlaceholder, { backgroundColor: themeColors.primary }]}>
              <Text style={styles.friendAvatarText}>
                {(friend.display_name || friend.username).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.friendInfo}>
            <Text style={[styles.friendName, { color: themeColors.text }]}>
              {friend.display_name || friend.username}
            </Text>
            <Text style={[styles.friendUsername, { color: themeColors.subtext }]}>
              @{friend.username}
            </Text>
            <View style={styles.friendRank}>
              <Text style={styles.friendRankEmoji}>{getRankEmoji(friend.current_rank)}</Text>
              <Text style={[styles.friendRankText, { color: themeColors.subtext }]}>
                {friend.current_rank}
              </Text>
            </View>
          </View>

          {showAddButton && (
            <Pressable style={[styles.addButton, { backgroundColor: themeColors.primary }]}>
              <UserPlus size={18} color="white" />
            </Pressable>
          )}
        </View>

        <View style={styles.friendStats}>
          <View style={styles.friendStat}>
            <Text style={[styles.friendStatNumber, { color: themeColors.primary }]}>
              {friend.xp.toLocaleString()}
            </Text>
            <Text style={[styles.friendStatLabel, { color: themeColors.subtext }]}>XP</Text>
          </View>
          
          <View style={styles.friendStat}>
            <Text style={[styles.friendStatNumber, { color: themeColors.primary }]}>
              {friend.bars_hit}
            </Text>
            <Text style={[styles.friendStatLabel, { color: themeColors.subtext }]}>Bars</Text>
          </View>
          
          <View style={styles.friendStat}>
            <Text style={[styles.friendStatNumber, { color: themeColors.primary }]}>
              {friend.nights_out}
            </Text>
            <Text style={[styles.friendStatLabel, { color: themeColors.subtext }]}>Nights</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: '#000000' }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Friends
            </Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color={themeColors.text} />
            </Pressable>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[
                styles.tabButton,
                activeTab === 'friends' && { backgroundColor: themeColors.primary }
              ]}
              onPress={() => setActiveTab('friends')}
            >
              <Users size={18} color={activeTab === 'friends' ? 'white' : themeColors.subtext} />
              <Text style={[
                styles.tabButtonText,
                { color: activeTab === 'friends' ? 'white' : themeColors.subtext }
              ]}>
                Friends ({friends.length})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.tabButton,
                activeTab === 'search' && { backgroundColor: themeColors.primary }
              ]}
              onPress={() => setActiveTab('search')}
            >
              <Search size={18} color={activeTab === 'search' ? 'white' : themeColors.subtext} />
              <Text style={[
                styles.tabButtonText,
                { color: activeTab === 'search' ? 'white' : themeColors.subtext }
              ]}>
                Search
              </Text>
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {activeTab === 'friends' && (
              <>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={themeColors.primary} />
                    <Text style={[styles.loadingText, { color: themeColors.subtext }]}>
                      Loading friends...
                    </Text>
                  </View>
                ) : friends.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>👥</Text>
                    <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                      No Friends Yet
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: themeColors.subtext }]}>
                      Search for friends to connect and share your nightlife adventures!
                    </Text>
                  </View>
                ) : (
                  <ScrollView 
                    style={styles.friendsList}
                    showsVerticalScrollIndicator={false}
                  >
                    {friends.map((friend) => (
                      <FriendCard key={friend.id} friend={friend} />
                    ))}
                    <View style={styles.footer} />
                  </ScrollView>
                )}
              </>
            )}

            {activeTab === 'search' && (
              <View style={styles.searchContainer}>
                <View style={[styles.searchInputContainer, { backgroundColor: themeColors.card }]}>
                  <Search size={20} color={themeColors.subtext} />
                  <TextInput
                    style={[styles.searchInput, { color: themeColors.text }]}
                    placeholder="Search users..."
                    placeholderTextColor={themeColors.subtext}
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      searchUsers(text);
                    }}
                    autoCapitalize="none"
                  />
                </View>

                {isSearching ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={themeColors.primary} />
                    <Text style={[styles.loadingText, { color: themeColors.subtext }]}>
                      Searching...
                    </Text>
                  </View>
                ) : searchQuery.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                      Search for Friends
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: themeColors.subtext }]}>
                      Enter a username to find other Bar Buddy users
                    </Text>
                  </View>
                ) : searchResults.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>😔</Text>
                    <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                      No Users Found
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: themeColors.subtext }]}>
                      No users match your search query
                    </Text>
                  </View>
                ) : (
                  <ScrollView 
                    style={styles.friendsList}
                    showsVerticalScrollIndicator={false}
                  >
                    {searchResults.map((user) => (
                      <FriendCard key={user.id} friend={user} showAddButton={true} />
                    ))}
                    <View style={styles.footer} />
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  friendsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  friendCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  glassOverlay: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  friendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  friendAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  friendAvatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  friendRank: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendRankEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  friendRankText: {
    fontSize: 13,
    fontWeight: '500',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  friendStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  friendStat: {
    alignItems: 'center',
  },
  friendStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  friendStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    height: 40,
  },
});

export default FriendsModal;