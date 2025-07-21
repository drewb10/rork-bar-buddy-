import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, Modal, ScrollView } from 'react-native';
import { Check, Shield, Calendar } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useTermsStore } from '@/stores/termsStore';
import { useAgeVerificationStore } from '@/stores/ageVerificationStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { useRouter } from 'expo-router';

interface OnboardingModalProps {
  visible: boolean;
  onComplete?: () => void;
}

type OnboardingStep = 'welcome' | 'age_verification' | 'terms' | 'complete';

export default function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile, updateProfile } = useAuthStore();
  const { acceptTerms } = useTermsStore();
  const { setVerified } = useAgeVerificationStore();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [ageVerified, setAgeVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAgeVerification = (isOfAge: boolean) => {
    if (!isOfAge) {
      Alert.alert(
        'Age Restriction',
        'You must be at least 21 years old to use BarBuddy. This app is designed for legal drinking activities.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setAgeVerified(true);
    setVerified(true);
    setCurrentStep('terms');
  };

  const handleTermsAcceptance = () => {
    setTermsAccepted(true);
    acceptTerms('1.0');
    setCurrentStep('complete');
  };

  const handleComplete = async () => {
    if (!ageVerified || !termsAccepted) {
      Alert.alert('Error', 'Please complete all steps before continuing.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (profile && updateProfile) {
        await updateProfile({
          has_completed_onboarding: true
        });
      }
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.logoContainer}>
        <BarBuddyLogo size="large" />
      </View>
      
      <Text style={[styles.title, { color: themeColors.text }]}>
        Welcome to BarBuddy!
      </Text>
      
      <Text style={[styles.description, { color: themeColors.subtext }]}>
        Your ultimate companion for discovering nightlife, tracking your adventures, and connecting with fellow bar enthusiasts.
      </Text>
      
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Check size={20} color={themeColors.primary} />
          <Text style={[styles.featureText, { color: themeColors.text }]}>
            Discover local bars and venues
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Check size={20} color={themeColors.primary} />
          <Text style={[styles.featureText, { color: themeColors.text }]}>
            Track your nightlife activities
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Check size={20} color={themeColors.primary} />
          <Text style={[styles.featureText, { color: themeColors.text }]}>
            Earn XP and unlock achievements
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Check size={20} color={themeColors.primary} />
          <Text style={[styles.featureText, { color: themeColors.text }]}>
            Connect with other bar enthusiasts
          </Text>
        </View>
      </View>
      
      <Pressable 
        style={[styles.primaryButton, { backgroundColor: themeColors.primary }]}
        onPress={() => setCurrentStep('age_verification')}
      >
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </Pressable>
    </View>
  );

  const renderAgeVerificationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Calendar size={48} color={themeColors.primary} />
      </View>
      
      <Text style={[styles.title, { color: themeColors.text }]}>
        Age Verification
      </Text>
      
      <Text style={[styles.description, { color: themeColors.subtext }]}>
        BarBuddy is designed for adults who are of legal drinking age. Please confirm that you are at least 21 years old.
      </Text>
      
      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.primaryButton, { backgroundColor: themeColors.primary }]}
          onPress={() => handleAgeVerification(true)}
        >
          <Text style={styles.primaryButtonText}>I am 21 or older</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.secondaryButton, { borderColor: themeColors.border }]}
          onPress={() => handleAgeVerification(false)}
        >
          <Text style={[styles.secondaryButtonText, { color: themeColors.subtext }]}>
            I am under 21
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderTermsStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Shield size={48} color={themeColors.primary} />
      </View>
      
      <Text style={[styles.title, { color: themeColors.text }]}>
        Terms of Service
      </Text>
      
      <ScrollView style={styles.termsScrollView} showsVerticalScrollIndicator={true}>
        <View style={[styles.termsContent, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.termsSection, { color: themeColors.text }]}>
            <Text style={[styles.termsSectionTitle, { color: themeColors.primary }]}>
              Responsible Use{'\n'}
            </Text>
            • Use BarBuddy responsibly and in accordance with all applicable laws{'\n'}
            • Do not drink and drive - always arrange safe transportation{'\n'}
            • Respect venue policies and local regulations{'\n'}
            • Be respectful to other users and venue staff
          </Text>

          <Text style={[styles.termsSection, { color: themeColors.text }]}>
            <Text style={[styles.termsSectionTitle, { color: themeColors.primary }]}>
              Anonymous Chat Guidelines{'\n'}
            </Text>
            • Chat messages are anonymous and reset daily at 5:00 AM{'\n'}
            • Prohibited content includes hate speech, harassment, threats, and spam{'\n'}
            • Messages are automatically moderated for safety{'\n'}
            • Violations may result in chat restrictions or account suspension
          </Text>

          <Text style={[styles.termsSection, { color: themeColors.text }]}>
            <Text style={[styles.termsSectionTitle, { color: themeColors.primary }]}>
              Privacy & Data{'\n'}
            </Text>
            • We collect minimal data necessary for app functionality{'\n'}
            • Anonymous chat messages are not permanently stored{'\n'}
            • Location data is used only for venue recommendations{'\n'}
            • We do not sell your personal information to third parties
          </Text>

          <Text style={[styles.termsSection, { color: themeColors.text }]}>
            <Text style={[styles.termsSectionTitle, { color: themeColors.primary }]}>
              Limitation of Liability{'\n'}
            </Text>
            BarBuddy is a social platform for discovering nightlife venues. We are not responsible for your actions, venue policies, or any incidents that may occur at venues. Always drink responsibly and prioritize your safety.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.acceptanceContainer}>
        <Pressable 
          style={styles.checkboxContainer}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View style={[
            styles.checkbox, 
            { 
              borderColor: themeColors.primary,
              backgroundColor: termsAccepted ? themeColors.primary : 'transparent' 
            }
          ]}>
            {termsAccepted && <Check size={16} color="white" />}
          </View>
          <Text style={[styles.checkboxText, { color: themeColors.text }]}>
            I agree to the Terms of Service
          </Text>
        </Pressable>
        
        <Pressable 
          style={[
            styles.primaryButton, 
            { 
              backgroundColor: termsAccepted ? themeColors.primary : themeColors.border,
              opacity: termsAccepted ? 1 : 0.5
            }
          ]}
          onPress={handleTermsAcceptance}
          disabled={!termsAccepted}
        >
          <Text style={styles.primaryButtonText}>Accept & Continue</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Check size={48} color={themeColors.primary} />
      </View>
      
      <Text style={[styles.title, { color: themeColors.text }]}>
        You're All Set!
      </Text>
      
      <Text style={[styles.description, { color: themeColors.subtext }]}>
        Welcome to the BarBuddy community! Start exploring venues, tracking your adventures, and earning XP.
      </Text>
      
      <Pressable 
        style={[
          styles.primaryButton, 
          { 
            backgroundColor: themeColors.primary,
            opacity: isSubmitting ? 0.7 : 1
          }
        ]}
        onPress={handleComplete}
        disabled={isSubmitting}
      >
        <Text style={styles.primaryButtonText}>
          {isSubmitting ? 'Setting up...' : 'Start Exploring'}
        </Text>
      </Pressable>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'age_verification':
        return renderAgeVerificationStep();
      case 'terms':
        return renderTermsStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {renderCurrentStep()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  featureList: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  termsScrollView: {
    flex: 1,
    marginBottom: 24,
  },
  termsContent: {
    padding: 20,
    borderRadius: 12,
  },
  termsSection: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  termsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  acceptanceContainer: {
    paddingTop: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 14,
    flex: 1,
  },
});