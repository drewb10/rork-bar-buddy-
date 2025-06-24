import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, User, Lock, Check, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUpScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { signUp, isLoading, error, clearError, checkUsernameAvailability } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const checkUsername = async (usernameValue: string) => {
    if (usernameValue.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    
    setUsernameStatus('checking');
    const isAvailable = await checkUsernameAvailability(usernameValue);
    setUsernameStatus(isAvailable ? 'available' : 'taken');
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    clearError();
    
    // Debounce username checking
    setTimeout(() => {
      if (value === username) {
        checkUsername(value);
      }
    }, 500);
  };

  const handleSignUp = async () => {
    clearError();
    
    if (!username || !password || !confirmPassword || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (usernameStatus === 'taken') {
      Alert.alert('Error', 'Username is already taken. Please choose another.');
      return;
    }

    const success = await signUp(username, password, firstName, lastName);
    
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const navigateToSignIn = () => {
    router.push('/auth/sign-in');
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <ActivityIndicator size="small" color={themeColors.primary} />;
      case 'available':
        return <Check size={20} color="#4CAF50" />;
      case 'taken':
        return <X size={20} color="#FF4444" />;
      default:
        return null;
    }
  };

  const getUsernameStatusColor = () => {
    switch (usernameStatus) {
      case 'available':
        return '#4CAF50';
      case 'taken':
        return '#FF4444';
      default:
        return themeColors.border;
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

          {/* Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: '#FF4444' + '20' }]}>
              <Text style={[styles.errorText, { color: '#FF4444' }]}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Username */}
            <View style={styles.inputContainer}>
              <View style={[
                styles.inputWrapper, 
                { 
                  backgroundColor: themeColors.card, 
                  borderColor: getUsernameStatusColor()
                }
              ]}>
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
                <View style={styles.statusIcon}>
                  {getUsernameStatusIcon()}
                </View>
              </View>
              {usernameStatus === 'taken' && (
                <Text style={[styles.helperText, { color: '#FF4444' }]}>
                  Username is already taken
                </Text>
              )}
              {usernameStatus === 'available' && (
                <Text style={[styles.helperText, { color: '#4CAF50' }]}>
                  Username is available
                </Text>
              )}
            </View>

            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <User size={20} color={themeColors.subtext} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder="First Name"
                    placeholderTextColor={themeColors.subtext}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <User size={20} color={themeColors.subtext} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder="Last Name"
                    placeholderTextColor={themeColors.subtext}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
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

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Lock size={20} color={themeColors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={themeColors.subtext}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  {showConfirmPassword ? (
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
              style={[styles.signUpButton, { opacity: isLoading ? 0.7 : 1 }]}
            >
              <Pressable
                style={styles.signUpButtonInner}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                )}
              </Pressable>
            </LinearGradient>

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
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 16,
  },
  halfWidth: {
    width: '48%',
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
  statusIcon: {
    width: 20,
    alignItems: 'center',
  },
  eyeIcon: {
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
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