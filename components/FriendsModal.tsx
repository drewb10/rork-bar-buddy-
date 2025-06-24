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

interface FriendsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FriendsModal({ visible, onClose }: FriendsModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { user, profile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'search'>('friends');

  useEffect(() => {
    if (visible) {
      loadFriends();
    }
  }, [visible]);

  const loadFriends = async () => {
    if (!user) return;

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
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading friends:', error);
        return;
      }

      const friendsList = data?.map(item => item.profiles).filter(Boolean) || [];
      setFriends(friendsList as Friend[]);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, xp, nights_out, bars_hit, profile_picture')
        .ilike('username', `%${searchQuery.trim()}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        Alert.alert('Error', 'Failed to search users');
        return;
      }

      // Filter out users who are already friends
      const friendIds = friends.map(f => f.id);
      const filteredResults<boltArtifact id="auth-system-implementation" title="Username and Password Authentication System">