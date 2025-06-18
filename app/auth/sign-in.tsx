import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignInScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { signIn, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const success = await signIn(email, password);
    
    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error', 'Invalid email or password');
    }
  };

  const navigateToSignUp = () => {
    router.push('/auth/sign-up');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <BarBuddyLogo size="large" />
            
            <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
              Welcome back to the best bar experience
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Mail size={20} color={themeColors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Email"
                  placeholderTextColor={themeColors.subtext}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Lock size={20} color={themeColors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Password"
                  placeholderTextColor={themeColors.subtext}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={themeColors.subtext} />
                  ) : (
                    <Eye size={20} color={themeColors.subtext} />
                  )}
                </Pressable>
              </View>
            </View>

            <LinearGradient
              colors={['#FF6A00', '#FF4500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.signInButton, { opacity: isLoading ? 0.7 : 1 }]}
            >
              <Pressable
                style={styles.signInButtonInner}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                <Text style={styles.signInButtonText}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </Pressable>
            </LinearGradient>

            <View style={styles.signUpContainer}>
              <Text style={[styles.signUpText, { color: themeColors.subtext }]}>
                Don't have an account?{' '}
              </Text>
              <Pressable onPress={navigateToSignUp}>
                <Text style={[styles.signUpLink, { color: themeColors.primary }]}>
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  signInButton: {
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 24,
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  signInButtonInner: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
  },
  signUpLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});