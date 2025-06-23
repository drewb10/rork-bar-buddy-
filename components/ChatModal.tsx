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
import { useChatStore } from '@/stores/chatStore';
import { Venue } from '@/types/venue';
import { BlurView } from 'expo-blur';

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [scaleAnimation] = useState(new Animated.Value(0));
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && venue?.id && !isInitialized) {
      initializeChat();
      // Animate in
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else if (!visible) {
      // Clean up when modal closes
      cleanup();
      setIsInitialized(false);
      scaleAnimation.setValue(0);
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
    if (messages.length > 0) {
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

    setIsSending(true);
    const messageToSend = trimmedContent;
    setInputText('');

    try {
      await sendMessage(venue.id, messageToSend);
    } catch (error) {
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
    
    // Animate out
    Animated.spring(scaleAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      onClose();
    });
  };

  if (!venue) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {Platform.OS !== 'web' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: themeColors.overlay }]} />
        )}
        
        <Animated.View 
          style={[
            styles.container, 
            { 
              backgroundColor: themeColors.cardElevated,
              transform: [{ scale: scaleAnimation }]
            }
          ]}
        >
          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: themeColors.cardElevated, borderBottomColor: themeColors.border }]}>
              <View style={styles.headerContent}>
                <View style={styles.headerTitleRow}>
                  <View style={[styles.iconContainer, { backgroundColor: themeColors.primary + '20' }]}>
                    <MessageCircle size={20} color={themeColors.primary} />
                  </View>
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
                  style={[styles.termsButton, { backgroundColor: themeColors.border }]}
                  onPress={() => setShowTerms(true)}
                >
                  <AlertTriangle size={16} color={themeColors.subtext} />
                </Pressable>
                <Pressable
                  style={[styles.closeButton, { backgroundColor: themeColors.border }]}
                  onPress={handleClose}
                >
                  <X size={20} color={themeColors.text} />
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
                      shadowColor: themeColors.shadowSecondary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }]}>
                      <Text style={[styles.messageText, { color: themeColors.text }]}>
                        {message.content}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Input */}
            <View style={[styles.inputContainer, { backgroundColor: themeColors.cardElevated, borderTopColor: themeColors.border }]}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: themeColors.background,
                    color: themeColors.text,
                    borderColor: themeColors.border,
                    shadowColor: themeColors.shadowSecondary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
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
                    backgroundColor: (inputText && inputText.trim() && !isSending) ? themeColors.primary : themeColors.border,
                    opacity: (inputText && inputText.trim() && !isSending) ? 1 : 0.5,
                    shadowColor: (inputText && inputText.trim() && !isSending) ? themeColors.shadowPrimary : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: (inputText && inputText.trim() && !isSending) ? 4 : 0,
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
            </View>
          </KeyboardAvoidingView>
        </Animated.View>

        {/* Terms Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showTerms}
          onRequestClose={() => setShowTerms(false)}
        >
          <View style={styles.termsOverlay}>
            <View style={[styles.termsContent, { 
              backgroundColor: themeColors.cardElevated,
              shadowColor: themeColors.shadowSecondary,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 12,
            }]}>
              <Text style={[styles.termsTitle, { color: themeColors.text }]}>
                Chat Guidelines
              </Text>
              <ScrollView style={styles.termsScroll}>
                <Text style={[styles.termsText, { color: themeColors.text }]}>
                  Welcome to BarBuddy anonymous chat! To keep our community safe and fun:{"

"}
                  • Be respectful and kind to others{"
"}
                  • No inappropriate language or content{"
"}
                  • No sharing of personal information{"
"}
                  • No harassment or bullying{"
"}
                  • No spam or promotional content{"
"}
                  • Keep conversations venue-related and fun{"

"}
                  Messages are automatically filtered for inappropriate content. Violations may result in temporary chat restrictions.{"

"}
                  Have fun and stay safe! 🍻
                </Text>
              </ScrollView>
              <Pressable
                style={[styles.termsCloseButton, { 
                  backgroundColor: themeColors.primary,
                  shadowColor: themeColors.shadowPrimary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }]}
                onPress={() => setShowTerms(false)}
              >
                <Text style={styles.termsCloseText}>Got it!</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    height: '90%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
    gap: 8,
  },
  termsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
    borderRadius: 16,
    borderTopLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 20,
    padding: 24,
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
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 28,
    alignItems: 'center',
  },
  termsCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});