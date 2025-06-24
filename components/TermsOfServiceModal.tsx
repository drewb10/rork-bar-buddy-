import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, ScrollView, Alert } from 'react-native';
import { X, Shield, Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';

interface TermsOfServiceModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function TermsOfServiceModal({ visible, onAccept, onDecline }: TermsOfServiceModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isScrolledToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    
    if (isScrolledToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (!hasReadTerms) {
      Alert.alert(
        'Please Confirm',
        'You must check the box to confirm you have read and agree to the Terms of Service.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Log acceptance for compliance
    const acceptanceData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      userAgent: 'BarBuddy Mobile App',
      accepted: true
    };
    
    // In a real app, you would send this to your backend
    console.log('Terms of Service Accepted:', acceptanceData);
    
    onAccept();
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onDecline}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <View style={styles.headerContent}>
            <BarBuddyLogo size="small" />
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              Terms of Service
            </Text>
          </View>
          <Pressable style={styles.closeButton} onPress={onDecline}>
            <X size={24} color={themeColors.subtext} />
          </Pressable>
        </View>

        {/* Terms Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
        >
          <View style={[styles.termsCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.iconContainer}>
              <Shield size={32} color={themeColors.primary} />
            </View>
            
            <Text style={[styles.welcomeText, { color: themeColors.text }]}>
              Welcome to BarBuddy! Please read and accept our Terms of Service to continue.
            </Text>

            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
              1. Acceptance of Terms
            </Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>
              By using BarBuddy, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </Text>

            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
              2. Age Requirement
            </Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>
              You must be at least 21 years old to use BarBuddy. By using our service, you represent and warrant that you meet this age requirement.
            </Text>

            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
              3. Responsible Use
            </Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>
              • Use BarBuddy responsibly and in accordance with all applicable laws{'\n'}
              • Do not drink and drive - always arrange safe transportation{'\n'}
              • Respect venue policies and local regulations{'\n'}
              • Be respectful to other users and venue staff{'\n'}
              • Do not share personal information in public chats
            </Text>

            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
              4. Anonymous Chat Guidelines
            </Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>
              • Chat messages are anonymous and reset daily at 5:00 AM{'\n'}
              • Prohibited content includes hate speech, harassment, threats, spam, and personal information sharing{'\n'}
              • Messages are automatically moderated for safety{'\n'}
              • Violations may result in chat restrictions or account suspension
            </Text>

            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
              5. Privacy & Data
            </Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>
              • We collect minimal data necessary for app functionality{'\n'}
              • Anonymous chat messages are not permanently stored{'\n'}
              • Location data is used only for venue recommendations{'\n'}
              • We do not sell your personal information to third parties
            </Text>

            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
              6. Limitation of Liability
            </Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>
              BarBuddy is a social platform for discovering nightlife venues. We are not responsible for your actions, venue policies, or any incidents that may occur at venues. Always drink responsibly and prioritize your safety.
            </Text>

            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
              7. Modifications
            </Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>
              We may update these Terms of Service from time to time. Continued use of BarBuddy after changes constitutes acceptance of the new terms.
            </Text>

            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
              8. Contact Information
            </Text>
            <Text style={[styles.sectionText, { color: themeColors.text }]}>
              If you have questions about these Terms of Service, please contact us through the app's support feature.
            </Text>

            <View style={[styles.lastUpdated, { backgroundColor: themeColors.background }]}>
              <Text style={[styles.lastUpdatedText, { color: themeColors.subtext }]}>
                Last updated: December 2024{'\n'}
                Version 1.0
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Agreement Section */}
        <View style={[styles.agreementSection, { 
          backgroundColor: themeColors.card, 
          borderTopColor: themeColors.border 
        }]}>
          <Pressable 
            style={styles.checkboxContainer}
            onPress={() => setHasReadTerms(!hasReadTerms)}
          >
            <View style={[
              styles.checkbox, 
              { 
                backgroundColor: hasReadTerms ? themeColors.primary : 'transparent',
                borderColor: themeColors.primary 
              }
            ]}>
              {hasReadTerms && <Check size={16} color="white" />}
            </View>
            <Text style={[styles.checkboxText, { color: themeColors.text }]}>
              I have read and agree to the Terms of Service
            </Text>
          </Pressable>

          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.button, styles.declineButton, { borderColor: themeColors.border }]}
              onPress={onDecline}
            >
              <Text style={[styles.declineButtonText, { color: themeColors.subtext }]}>
                Decline
              </Text>
            </Pressable>
            
            <Pressable 
              style={[
                styles.button, 
                styles.acceptButton, 
                { 
                  backgroundColor: hasReadTerms ? themeColors.primary : themeColors.border,
                  opacity: hasReadTerms ? 1 : 0.5
                }
              ]}
              onPress={handleAccept}
              disabled={!hasReadTerms}
            >
              <Text style={styles.acceptButtonText}>
                Accept & Continue
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  termsCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '500',
  },
  lastUpdated: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  agreementSection: {
    padding: 20,
    borderTopWidth: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  acceptButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});