import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { MessageCircle, Send, Sparkles, MapPin, Calendar, Users, Star } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { venues } from '@/mocks/venues';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  suggestions?: string[];
}

interface BarBuddyChatbotProps {
  onClose?: () => void;
}

export default function BarBuddyChatbot({ onClose }: BarBuddyChatbotProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();

    // Initial greeting
    setTimeout(() => {
      addBotMessage(
        "Hey there! 🍻 I'm BarBuddy, your nightlife companion! I can help you find the perfect spots, check out tonight's specials, or plan your next adventure. What are you in the mood for?",
        [
          "Show me tonight's specials",
          "Find bars near me",
          "What's popular right now?",
          "Plan my night out"
        ]
      );
    }, 500);
  }, []);

  const addBotMessage = (text: string, suggestions?: string[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isBot: true,
      timestamp: new Date(),
      suggestions
    };
    
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const addUserMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isBot: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const simulateTyping = () => {
    setIsTyping(true);
    return new Promise(resolve => {
      setTimeout(() => {
        setIsTyping(false);
        resolve(true);
      }, 1000 + Math.random() * 1000);
    });
  };

  const getBotResponse = async (userInput: string): Promise<{ text: string; suggestions?: string[] }> => {
    const input = userInput.toLowerCase();
    
    // Tonight's specials
    if (input.includes('special') || input.includes('deal') || input.includes('tonight')) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todaySpecials = venues.flatMap(venue => 
        venue.specials
          .filter(special => special.day.toLowerCase() === today.toLowerCase())
          .map(special => ({ venue: venue.name, special }))
      );
      
      if (todaySpecials.length > 0) {
        const specialsList = todaySpecials.slice(0, 3).map(({ venue, special }) => 
          `🍻 ${venue}: ${special.title} - ${special.description}`
        ).join('\n\n');
        
        return {
          text: `Here are tonight's hottest specials! 🔥\n\n${specialsList}\n\nWant me to show you more or help you pick the perfect spot?`,
          suggestions: ["Show me more specials", "Help me choose", "What's the vibe like?", "Get directions"]
        };
      } else {
        return {
          text: "Hmm, looks like it's a quiet night for specials, but that doesn't mean we can't have fun! 🎉 Want me to show you the most popular spots or help you discover something new?",
          suggestions: ["Show popular venues", "Find something new", "What's open late?", "Best for groups"]
        };
      }
    }
    
    // Find bars/venues
    if (input.includes('bar') || input.includes('venue') || input.includes('find') || input.includes('near')) {
      const topVenues = venues.slice(0, 3);
      const venuesList = topVenues.map(venue => 
        `${venue.name} ⭐ ${venue.rating}\n${venue.types.map(t => t.replace('-', ' ')).join(' • ')}`
      ).join('\n\n');
      
      return {
        text: `Here are some awesome spots I'd recommend! 🌟\n\n${venuesList}\n\nEach of these has its own vibe - want me to tell you more about any of them?`,
        suggestions: ["Tell me about The Library", "What's the vibe at JBA?", "Show me all venues", "Find sports bars"]
      };
    }
    
    // Popular/trending
    if (input.includes('popular') || input.includes('trending') || input.includes('hot') || input.includes('busy')) {
      return {
        text: "Right now, The Library and JBA are absolutely buzzing! 🔥 The Library's got that chill sports bar energy with great happy hour deals, while JBA is perfect if you're looking for craft cocktails and a more upscale vibe. Both are packed with good energy tonight!",
        suggestions: ["Tell me about The Library", "What's JBA like?", "Show me live music", "Find the party"]
      };
    }
    
    // Planning night out
    if (input.includes('plan') || input.includes('night out') || input.includes('adventure')) {
      return {
        text: "Let's plan an epic night! 🎯 Are you looking for a chill hangout with friends, want to dance the night away, or maybe bar hop and try different vibes? I can create the perfect route based on what you're feeling!",
        suggestions: ["Chill night with friends", "Dance and party", "Bar hopping tour", "Something unique"]
      };
    }
    
    // Specific venue questions
    if (input.includes('library')) {
      return {
        text: "The Library is such a solid choice! 📚🍺 It's got that perfect sports bar vibe - great for watching games, hanging with friends, and their happy hour (4-7 PM) is legendary. Plus, they've got pool tables and a really welcoming crowd. Perfect for a laid-back but fun night!",
        suggestions: ["Get directions", "See their specials", "What's nearby?", "Plan my route"]
      };
    }
    
    if (input.includes('jba')) {
      return {
        text: "JBA is absolutely amazing! ✨ It's an art bar with craft cocktails, live music, and such a cool creative atmosphere. Perfect for date nights or when you want to feel a bit fancy. They do karaoke on Wednesdays and jazz on Sundays - it's got serious style!",
        suggestions: ["See their events", "What's the dress code?", "Show me cocktails", "Plan my visit"]
      };
    }
    
    // Vibe questions
    if (input.includes('vibe') || input.includes('atmosphere') || input.includes('feel')) {
      return {
        text: "Each spot has its own personality! 🎭 Want something chill and friendly? Hit The Library. Looking for creative energy and craft cocktails? JBA's your spot. Want to dance? Late Nite is where the party's at. I can match you with the perfect vibe - what mood are you in?",
        suggestions: ["Chill and friendly", "Creative and artsy", "Dance and party", "Something romantic"]
      };
    }
    
    // Default responses
    const defaultResponses = [
      {
        text: "That sounds interesting! 🤔 Want me to help you find the perfect spot for that? I know all the best places in town and can match you with exactly what you're looking for!",
        suggestions: ["Show me options", "What's popular?", "Find something unique", "Help me decide"]
      },
      {
        text: "I love your energy! 🙌 Let me help you make tonight awesome. Are you thinking drinks, food, music, or maybe all three? I've got the inside scoop on where to go!",
        suggestions: ["Great drinks", "Live music", "Good food", "All of the above!"]
      },
      {
        text: "You know what? Let's make this night legendary! 🌟 I can show you the hottest spots, the best deals, or help you discover something totally new. What sounds good to you?",
        suggestions: ["Show me hot spots", "Find the best deals", "Discover something new", "Surprise me!"]
      }
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    addUserMessage(userMessage);
    
    await simulateTyping();
    const response = await getBotResponse(userMessage);
    addBotMessage(response.text, response.suggestions);
  };

  const handleSuggestionPress = async (suggestion: string) => {
    addUserMessage(suggestion);
    await simulateTyping();
    const response = await getBotResponse(suggestion);
    addBotMessage(response.text, response.suggestions);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: themeColors.card,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <View style={styles.headerContent}>
            <View style={[styles.avatarContainer, { backgroundColor: themeColors.primary }]}>
              <Sparkles size={20} color="white" />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: themeColors.text }]}>
                BarBuddy
              </Text>
              <Text style={[styles.headerSubtitle, { color: themeColors.primary }]}>
                Your nightlife companion
              </Text>
            </View>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: '#4CAF50' }]} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View key={message.id} style={styles.messageWrapper}>
              <View
                style={[
                  styles.messageBubble,
                  message.isBot ? styles.botMessage : styles.userMessage,
                  {
                    backgroundColor: message.isBot 
                      ? themeColors.background 
                      : themeColors.primary,
                    borderColor: message.isBot ? themeColors.border : 'transparent',
                  }
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    {
                      color: message.isBot ? themeColors.text : 'white'
                    }
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    {
                      color: message.isBot 
                        ? themeColors.subtext 
                        : 'rgba(255,255,255,0.7)'
                    }
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
              
              {/* Suggestions */}
              {message.isBot && message.suggestions && (
                <View style={styles.suggestionsContainer}>
                  {message.suggestions.map((suggestion, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.suggestionButton,
                        { 
                          backgroundColor: themeColors.primary + '20',
                          borderColor: themeColors.primary + '40'
                        }
                      ]}
                      onPress={() => handleSuggestionPress(suggestion)}
                    >
                      <Text style={[styles.suggestionText, { color: themeColors.primary }]}>
                        {suggestion}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <View style={styles.typingContainer}>
              <View style={[styles.typingBubble, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, { backgroundColor: themeColors.subtext }]} />
                  <View style={[styles.typingDot, { backgroundColor: themeColors.subtext }]} />
                  <View style={[styles.typingDot, { backgroundColor: themeColors.subtext }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: themeColors.card,
                color: themeColors.text,
                borderColor: themeColors.border,
              }
            ]}
            placeholder="Ask me about bars, specials, or planning your night..."
            placeholderTextColor={themeColors.subtext}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
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
            disabled={!inputText.trim()}
          >
            <Send size={18} color="white" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  botMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginLeft: 8,
    gap: 6,
  },
  suggestionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 15,
    fontWeight: '500',
  },
  sendButton: {
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
});