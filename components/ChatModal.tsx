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
  Animated,
} from 'react-native';
import { X, Send, TriangleAlert as AlertTriangle, MessageCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueChatStore } from '@/stores/venueChatStore';
import { Venue } from '@/types/venue';

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
  } = useVenueChatStore();
  const [inputText, setInputText] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values for premium interactions
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    if (visible && venue?.id && !isInitialized) {
      initializeChat();
    } else if (!visible) {
      // Clean up when modal closes
      cleanup();
      setIsInitialized(false);
    }

    return () => {
      if (!visible) {
        cleanup();
      }
    };
  }, [visible, venue?.id]);

  const initializeChat = async () => {
    try {
      clearError();
      
      if (!venue?.id || venue.id.trim() === '') {
        console.error('Invalid venue ID:', venue?.id);
        Alert.alert(
          'Connection Error',
          'Invalid venue information. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsInitialized(true);
      
      // Initialize session and load messages
      await createOrGetSession(venue.id);
      await loadMessages(venue.id);
      
      // Subscribe to real-time updates
      subscribeToMessages(venue.id);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      // Don't show alert for initialization errors, just log them
      setIsInitialized(false);
    }
  };

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText || !inputText.trim() || isSending) return;

    const trimmedContent = inputText.trim();
    if (trimmedContent.length === 0) {
      Alert.alert(
        'Empty Message',
        'Please enter a message before sending.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!venue?.id || venue.id.trim() === '') {
      Alert.alert(
        'Error',
        'Invalid venue information. Please close and reopen the chat.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Subtle press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();

    setIsSending(true);
    const messageToSend = trimmedContent;
    setInputText('');

    try {
      await sendMessage(venue.id, messageToSend);
    } catch (error) {
      setInputText(messageToSend);
      const errorMessage = error instanceof Error ? error.message : 'Could not send your message. Please try again.';
      
      // Show user-friendly error message
      Alert.alert(
        'Failed to Send',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSending(false);
    }
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
    cleanup();
    setIsInitialized(false);
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
        {/* Header with glassmorphism effect - REDUCED FONT SIZE */}
        <View style={[styles.header, { 
          backgroundColor: themeColors.glass.background, 
          borderBottomColor: themeColors.glass.border 
        }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <MessageCircle size={18} color={themeColors.primary} />
              <Text style={[styles.headerTitle, { color: themeColors.text }]}>
                {venue.name}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: themeColors.subtext }]}>
              Anonymous Chat • {messages?.length || 0} messages
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.termsButton}
              onPress={() => setShowTerms(true)}
            >
              <AlertTriangle size={18} color={themeColors.subtext} />
            </Pressable>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
            >
              <X size={22} color={themeColors.text} />
            </Pressable>
          </View>
        </View>

        {/* Error Banner - Only show critical errors */}
        {error && error.includes('Failed to send') && (
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
          {isLoading && (!messages || messages.length === 0) ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={[styles.loadingText, { color: themeColors.subtext }]}>
                Loading chat...
              </Text>
            </View>
          ) : (!messages || messages.length === 0) ? (
            <View style={styles.emptyState}>
              <MessageCircle size={48} color={themeColors.subtext} />
              <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>
                Start the conversation!
              </Text>
              <Text style={[styles.emptyStateText, { color: themeColors.subtext }]}>
                Be the first to say hello in {venue.name} chat
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
                <View style={[styles.messageBubble, { 
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.glass.border,
                }]}>
                  <Text style={[styles.messageText, { color: themeColors.text }]}>
                    {message.content}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Input with enhanced styling */}
        <View style={[styles.inputContainer, { 
          backgroundColor: themeColors.glass.background, 
          borderTopColor: themeColors.glass.border 
        }]}>
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
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              style={[
                styles.sendButton,
                {
                  backgroundColor: (inputText && inputText.trim() && !isSending) ? themeColors.primary : themeColors.border,
                  opacity: (inputText && inputText.trim() && !isSending) ? 1 : 0.5,
                }
              ]}
              onPress={handleSendMessage}
              disabled={!inputText || !inputText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Send size={20} color="white" />
              )}
            </Pressable>
          </Animated.View>
        </View>

        {/* Terms Modal with glassmorphism */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showTerms}
          onRequestClose={() => setShowTerms(false)}
        >
          <View style={styles.termsOverlay}>
            <View style={[styles.termsContent, { 
              backgroundColor: themeColors.glass.background,
              borderColor: themeColors.glass.border,
            }]}>
              <Text style={[styles.termsTitle, { color: themeColors.text }]}>
                Chat Guidelines & Safety
              </Text>
              <ScrollView style={styles.termsScroll}>
                <Text style={[styles.termsText, { color: themeColors.text }]}>
                  {`Welcome to BarBuddy anonymous chat! To keep our community safe and fun:

✅ DO:
• Be respectful and kind to others
• Keep conversations venue-related and fun
• Respect others' privacy and anonymity
• Report inappropriate behavior

❌ DON'T:
• Share personal information (phone, email, social media)
• Use hate speech, threats, or harassment
• Send spam or promotional content
• Engage in sexual harassment
• Bully or target other users

🔒 Privacy & Safety:
• Messages reset daily at 5:00 AM
• All content is automatically moderated
• Violations may result in chat restrictions
• Your safety is our priority

Have fun and stay safe! 🍻`}
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsButton: {
    padding: 12,
    marginRight: 8,
  },
  closeButton: {
    padding: 12,
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
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
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
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  messageTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageBubble: {
    padding: 16,
    borderRadius: 16,
    borderTopLeftRadius: 6,
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginRight: 16,
    maxHeight: 100,
    fontSize: 16,
    fontWeight: '500',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  termsOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  termsContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  termsTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  termsScroll: {
    maxHeight: 400,
  },
  termsText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  termsCloseButton: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  termsCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});