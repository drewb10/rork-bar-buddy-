import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, Check, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUpScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { signUp, isLoading, error, clearError, checkUsernameAvailable } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string): boolean => {
    return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const checkUsername = async (username: string) => {
    if (!validateUsername(username)) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    const isAvailable = await checkUsernameAvailable(username);
    setUsernameStatus(isAvailable ? 'available' : 'taken');
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    
    // Debounce username checking
    setTimeout(() => {
      if (text === username) {
        checkUsername(text);
      }
    }, 500);
  };

  const handleSignUp = async () => {
    clearError();

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!validateUsername(username)) {
      Alert.alert('Invalid Username', 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    if (usernameStatus === 'taken') {
      Alert.alert('Username Taken', 'This username is already taken. Please choose another.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long');
      return;
    }

    console.log('🎯 SignUp: Starting signup with:', { email, username });
    const success = await signUp(email, password, username);
    
    if (success) {
      console.log('🎯 SignUp: Success! Redirecting to tabs...');
      router.replace('/(tabs)');
    } else if (error) {
      console.log('🎯 SignUp: Failed with error:', error);
      Alert.alert('Sign Up Failed', error);
    }
  };

  const navigateToSignIn = () => {
    router.push('/auth/sign-in');
  };

  const getUsernameIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <Text style={styles.statusIcon}>⏳</Text>;
      case 'available':
        return <Check size={20} color="#4CAF50" />;
      case 'taken':
        return <X size={20} color="#FF4444" />;
      default:
        return null;
    }
  };

  const getUsernameHelperText = () => {
    if (!username) return null;
    
    if (!validateUsername(username)) {
      return (
        <Text style={[styles.helperText, { color: '#FF4444' }]}>
          3-20 characters, letters, numbers, and underscores only
        </Text>
      );
    }
    
    switch (usernameStatus) {
      case 'checking':
        return <Text style={[styles.helperText, { color: themeColors.subtext }]}>Checking availability...</Text>;
      case 'available':
        return <Text style={[styles.helperText, { color: '#4CAF50' }]}>Username is available!</Text>;
      case 'taken':
        return <Text style={[styles.helperText, { color: '#FF4444' }]}>Username is already taken</Text>;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <BarBuddyLogo size="large" />
            <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
              Join the best bar community
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: '#FF4444' + '20', borderColor: '#FF4444' }]}>
              <Text style={[styles.errorText, { color: '#FF4444' }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
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

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <User size={20} color={themeColors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Username"
                  placeholderTextColor={themeColors.subtext}
                  value={username}
                  onChangeText={handleUsernameChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.statusIconContainer}>
                  {getUsernameIcon()}
                </View>
              </View>
              {getUsernameHelperText()}
            </View>

            {/* Password Input */}
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
              {password && !validatePassword(password) && (
                <Text style={[styles.helperText, { color: '#FF4444' }]}>
                  Password must be at least 6 characters
                </Text>
              )}
            </View>

            {/* Sign Up Button */}
            <LinearGradient
              colors={['#FF6A00', '#FF4500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.signUpButton, { opacity: isLoading ? 0.7 : 1 }]}
            >
              <Pressable
                style={styles.signUpButtonInner}
                onPress={handleSignUp}
                disabled={isLoading || usernameStatus === 'taken' || usernameStatus === 'checking'}
              >
                <Text style={styles.signUpButtonText}>
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </Pressable>
            </LinearGradient>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={[styles.signInText, { color: themeColors.subtext }]}>
                Already have an account?{' '}
              </Text>
              <Pressable onPress={navigateToSignIn}>
                <Text style={[styles.signInLink, { color: themeColors.primary }]}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  statusIconContainer: {
    width: 24,
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 14,
  },
  signUpButton: {
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  signUpButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
  },
  signInLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});