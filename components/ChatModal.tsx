import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Send, AlertTriangle, Heart } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useChatStore } from '@/stores/chatStore';
import { Venue } from '@/types/venue';
import * as Haptics from 'expo-haptics';

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  venue: Venue;
}

export default function ChatModal({ visible, onClose, venue }: ChatModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    messages, 
    sendMessage, 
    loadMessages, 
    likeMessage,
    createOrGetSession,
    subscribeToMessages,
    unsubscribeFromMessages,
    cleanup,
    isLoading 
  } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      initializeChat();
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [visible, venue.id]);

  const initializeChat = async () => {
    try {
      await createOrGetSession(venue.id);
      await loadMessages(venue.id);
      subscribeToMessages(venue.id);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Check for inappropriate content
    if (containsInappropriateContent(inputText)) {
      Alert.alert(
        'Message Blocked',
        'Your message contains inappropriate content. Please keep the chat friendly and respectful.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await sendMessage(venue.id, inputText.trim());
      setInputText('');
    } catch (error) {
      Alert.alert(
        'Failed to Send',
        'Could not send your message. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLikeMessage = async (messageId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      await likeMessage(messageId);
    } catch (error) {
      console.error('Failed to like message:', error);
    }
  };

  const containsInappropriateContent = (text: string): boolean => {
    const inappropriateWords = [
      'fuck', 'shit', 'damn', 'bitch', 'ass', 'hell',
      'sex', 'porn', 'nude', 'naked', 'drug', 'drugs',
      'weed', 'cocaine', 'heroin', 'meth', 'ecstasy',
      'kill', 'die', 'death', 'suicide', 'murder',
      'hate', 'racist', 'nazi', 'terrorist'
    ];

    const lowerText = text.toLowerCase();
    return inappropriateWords.some(word => lowerText.includes(word));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: themeColors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              {venue.name} Chat
            </Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.subtext }]}>
              Anonymous • Be respectful
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.termsButton}
              onPress={() => setShowTerms(true)}
            >
              <AlertTriangle size={20} color={themeColors.subtext} />
            </Pressable>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color={themeColors.text} />
            </Pressable>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: themeColors.subtext }]}>
                No messages yet. Be the first to say hello!
              </Text>
            </View>
          ) : (
            messages.map((message) => (
              <View key={message.id} style={styles.messageContainer}>
                <View style={styles.messageHeader}>
                  <Text style={[styles.messageSender, { color: themeColors.primary }]}>
                    {message.anonymous_name}
                  </Text>
                  <Text style={[styles.messageTime, { color: themeColors.subtext }]}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
                <View style={[styles.messageBubble, { backgroundColor: themeColors.card }]}>
                  <Text style={[styles.messageText, { color: themeColors.text }]}>
                    {message.content}
                  </Text>
                  <View style={styles.messageActions}>
                    <Pressable
                      style={styles.likeButton}
                      onPress={() => handleLikeMessage(message.id)}
                    >
                      <Heart 
                        size={16} 
                        color={message.likes > 0 ? themeColors.primary : themeColors.subtext}
                        fill={message.likes > 0 ? themeColors.primary : 'transparent'}
                      />
                      {message.likes > 0 && (
                        <Text style={[styles.likeCount, { color: themeColors.subtext }]}>
                          {message.likes}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: themeColors.border,
              }
            ]}
            placeholder="Type a message..."
            placeholderTextColor={themeColors.subtext}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={200}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
          />
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() ? themeColors.primary : themeColors.border,
                opacity: inputText.trim() ? 1 : 0.5,
              }
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color="white" />
          </Pressable>
        </View>

        {/* Terms Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showTerms}
          onRequestClose={() => setShowTerms(false)}
        >
          <View style={styles.termsOverlay}>
            <View style={[styles.termsContent, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.termsTitle, { color: themeColors.text }]}>
                Chat Guidelines
              </Text>
              <ScrollView style={styles.termsScroll}>
                <Text style={[styles.termsText, { color: themeColors.text }]}>
                  {"Welcome to BarBuddy's anonymous chat! To keep our community safe and fun:\n\n• Be respectful and kind to others\n• No inappropriate language or content\n• No sharing of personal information\n• No harassment or bullying\n• No spam or promotional content\n• Keep conversations venue-related and fun\n\nMessages are automatically filtered for inappropriate content. Violations may result in temporary chat restrictions.\n\nHave fun and stay safe! 🍻"}
                </Text>
              </ScrollView>
              <Pressable
                style={[styles.termsCloseButton, { backgroundColor: themeColors.primary }]}
                onPress={() => setShowTerms(false)}
              >
                <Text style={styles.termsCloseText}>Got it!</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsButton: {
    padding: 8,
    marginRight: 8,
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 12,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 8,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  likeCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Terms modal styles
  termsOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  termsContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  termsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  termsScroll: {
    maxHeight: 300,
  },
  termsText: {
    fontSize: 16,
    lineHeight: 24,
  },
  termsCloseButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  termsCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});