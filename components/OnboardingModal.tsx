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
    if (!profile) {
      router.push('/auth/sign-up');
      return;
    }
    
    if (!ageVerified || !termsAccepted) {
      Alert.alert('Verification Required', 'Please complete age verification and accept terms to continue.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProfile({ 
        has_completed_onboarding: true,
        updated_at: new Date().toISOString()
      });
      
      setIsSubmitting(false);
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
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
      
      <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
        Your ultimate nightlife companion for discovering bars, tracking your adventures, and connecting with fellow bar enthusiasts.
      </Text>

      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🍻</Text>
          <Text style={[styles.featureText, { color: themeColors.text }]}>
            Discover the best bars in your area
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📊</Text>
          <Text style={[styles.featureText, { color: themeColors.text }]}>
            Track your nightlife stats and achievements
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>💬</Text>
          <Text style={[styles.featureText, { color: themeColors.text }]}>
            Chat anonymously with other bar-goers
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🏆</Text>
          <Text style={[styles.featureText, { color: themeColors.text }]}>
            Earn XP and unlock new ranks
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
        Age Verification Required
      </Text>
      
      <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
        BarBuddy is designed for responsible adults who are of legal drinking age.
      </Text>
      
      <Text style={[styles.question, { color: themeColors.text }]}>
        Are you 21 years of age or older?
      </Text>
      
      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.secondaryButton, { borderColor: themeColors.error }]}
          onPress={() => handleAgeVerification(false)}
        >
          <Text style={[styles.secondaryButtonText, { color: themeColors.error }]}>
            No, I am under 21
          </Text>
        </Pressable>
        
        <Pressable 
          style={[styles.primaryButton, { backgroundColor: themeColors.primary }]}
          onPress={() => handleAgeVerification(true)}
        >
          <Text style={styles.primaryButtonText}>
            Yes, I am 21 or older
          </Text>
        </Pressable>
      </View>
      
      <Text style={[styles.disclaimer, { color: themeColors.subtext }]}>
        By continuing, you confirm that you are of legal drinking age in your jurisdiction.
      </Text>
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
              Responsible Use{'
'}
            </Text>
            • Use BarBuddy responsibly and in accordance with all applicable laws{'
'}
            • Do not drink and drive - always arrange safe transportation{'
'}
            • Respect venue policies and local regulations{'
'}
            • Be respectful to other users and venue staff
          </Text>

          <Text style={[styles.termsSection, { color: themeColors.text }]}>
            <Text style={[styles.termsSectionTitle, { color: themeColors.primary }]}>
              Anonymous Chat Guidelines{'
'}
            </Text>
            • Chat messages are anonymous and reset daily at 5:00 AM{'
'}
            • Prohibited content includes hate speech, harassment, threats, and spam{'
'}
            • Messages are automatically moderated for safety{'
'}
            • Violations may result in chat restrictions or account suspension
          </Text>

          <Text style={[styles.termsSection, { color: themeColors.text }]}>
            <Text style={[styles.termsSectionTitle, { color: themeColors.primary }]}>
              Privacy & Data{'
'}
            </Text>
            • We collect minimal data necessary for app functionality{'
'}
            • Anonymous chat messages are not permanently stored{'
'}
            • Location data is used only for venue recommendations{'
'}
            • We do not sell your personal information to third parties
          </Text>

          <Text style={[styles.termsSection, { color: themeColors.text }]}>
            <Text style={[styles.termsSectionTitle, { color: themeColors.primary }]}>
              Limitation of Liability{'
'}
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
            I have read and accept the Terms of Service and Privacy Policy
          </Text>
        </Pressable>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.secondaryButton, { borderColor: themeColors.subtext }]}
          onPress={() => setCurrentStep('age_verification')}
        >
          <Text style={[styles.secondaryButtonText, { color: themeColors.subtext }]}>
            Back
          </Text>
        </Pressable>
        
        <Pressable 
          style={[
            styles.primaryButton, 
            { 
              backgroundColor: themeColors.primary,
              opacity: termsAccepted ? 1 : 0.5
            }
          ]}
          onPress={handleTermsAcceptance}
          disabled={!termsAccepted}
        >
          <Text style={styles.primaryButtonText}>
            Accept & Continue
          </Text>
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
        You are All Set!
      </Text>
      
      <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
        Welcome to the BarBuddy community! Start exploring bars, tracking your adventures, and earning XP.
      </Text>

      <View style={styles.featureList}>
        <View style={styles.completedItem}>
          <Check size={20} color={themeColors.primary} />
          <Text style={[styles.completedText, { color: themeColors.text }]}>
            Age verified (21+)
          </Text>
        </View>
        <View style={styles.completedItem}>
          <Check size={20} color={themeColors.primary} />
          <Text style={[styles.completedText, { color: themeColors.text }]}>
            Terms accepted
          </Text>
        </View>
        <View style={styles.completedItem}>
          <Check size={20} color={themeColors.primary} />
          <Text style={[styles.completedText, { color: themeColors.text }]}>
            Account ready
          </Text>
        </View>
      </View>
      
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

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {['welcome', 'age_verification', 'terms', 'complete'].map((step, index) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                {
                  backgroundColor: ['welcome', 'age_verification', 'terms', 'complete'].indexOf(currentStep) >= index
                    ? themeColors.primary
                    : themeColors.border
                }
              ]}
            />
          ))}
        </View>

        {renderCurrentStep()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 40,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  completedText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  termsScrollView: {
    maxHeight: 200,
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  termsContent: {
    padding: 16,
    borderRadius: 12,
    margin: 4,
  },
  termsSection: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  termsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  acceptanceContainer: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    alignSelf: 'stretch',
    paddingHorizontal: 16,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 16,
    paddingHorizontal: 16,
  },
});