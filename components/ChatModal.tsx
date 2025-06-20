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
  ActivityIndicator,
} from 'react-native';
import { X, Send, AlertTriangle, MessageCircle } from 'lucide-react-native';
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
    createOrGetSession,
    subscribeToMessages,
    unsubscribeFromMessages,
    cleanup,
    isLoading,
    error,
    clearError
  } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && venue?.id) {
      initializeChat();
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [visible, venue?.id]);

  const initializeChat = async () => {
    try {
      clearError();
      await createOrGetSession(venue.id);
      await loadMessages(venue.id);
      subscribeToMessages(venue.id);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Alert.alert(
        'Connection Error',
        'Failed to connect to chat. Please try again.',
        [{ text: 'OK' }]
      );
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
    if (!inputText.trim() || isSending) return;

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

    setIsSending(true);
    const messageToSend = inputText.trim();
    setInputText(''); // Clear input immediately for better UX

    try {
      await sendMessage(venue.id, messageToSend);
    } catch (error) {
      // Restore message if sending failed
      setInputText(messageToSend);
      Alert.alert(
        'Failed to Send',
        'Could not send your message. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSending(false);
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
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  if (!venue) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: themeColors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <MessageCircle size={20} color={themeColors.primary} />
              <Text style={[styles.headerTitle, { color: themeColors.text }]}>
                {venue.name}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: themeColors.subtext }]}>
              Anonymous Chat • {messages.length} messages
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
              onPress={handleClose}
            >
              <X size={24} color={themeColors.text} />
            </Pressable>
          </View>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: '#FF4444' }]}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={clearError}>
              <X size={16} color="white" />
            </Pressable>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading && messages.length === 0 ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={[styles.loadingText, { color: themeColors.subtext }]}>
                Loading chat...
              </Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageCircle size={48} color={themeColors.subtext} />
              <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>
                Start the conversation!
              </Text>
              <Text style={[styles.emptyStateText, { color: themeColors.subtext }]}>
                Be the first to say hello in {venue.name}'s chat
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
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
            editable={!isSending}
          />
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor: (inputText.trim() && !isSending) ? themeColors.primary : themeColors.border,
                opacity: (inputText.trim() && !isSending) ? 1 : 0.5,
              }
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send size={20} color="white" />
            )}
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
                  {"Welcome to BarBuddy's anonymous chat! To keep our community safe and fun:

• Be respectful and kind to others
• No inappropriate language or content
• No sharing of personal information
• No harassment or bullying
• No spam or promotional content
• Keep conversations venue-related and fun

Messages are automatically filtered for inappropriate content. Violations may result in temporary chat restrictions.

Have fun and stay safe! 🍻"}
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
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