import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Phone, Lock, User, Check, X, AlertCircle, Database } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUpScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { signUp, isLoading, error, clearError, checkUsernameAvailable, isConfigured } = useAuthStore();
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const validatePhone = (phone: string): boolean => {
    // Basic phone validation - accepts various formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
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
    try {
      const isAvailable = await checkUsernameAvailable(username);
      setUsernameStatus(isAvailable ? 'available' : 'taken');
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus('idle');
    }
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

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters except +
    const cleaned = text.replace(/[^\d\+]/g, '');
    setPhone(cleaned);
  };

  const handleSignUp = async () => {
    clearError();

    if (!isConfigured) {
      Alert.alert(
        'Database Setup Required', 
        `Your Supabase database needs to be configured. Please:

1. Run the latest migration (20250625013000_fix_schema_cache_final.sql) in your Supabase dashboard
2. Check your .env file has correct SUPABASE_URL and SUPABASE_ANON_KEY
3. Or try Demo Mode to test the app`,
        [
          { text: 'Setup Instructions', onPress: () => console.log('Check SETUP_INSTRUCTIONS.md') },
          { text: 'Try Demo Mode', onPress: () => router.replace('/(tabs)') }
        ]
      );
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number (e.g., +1234567890)');
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

    console.log('🎯 SignUp: Starting signup with:', { phone, username });
    
    try {
      const success = await signUp(phone, password, username);
      
      if (success) {
        console.log('🎯 SignUp: Success! Redirecting to tabs...');
        Alert.alert(
          'Account Created!',
          'Your account has been created successfully.',
          [
            { text: 'Continue', onPress: () => router.replace('/(tabs)') }
          ]
        );
      } else if (error) {
        console.log('🎯 SignUp: Failed with error:', error);
        
        // Show more user-friendly error messages
        let errorTitle = 'Sign Up Failed';
        let errorMessage = error;
        let showMigrationButton = false;
        
        if (error.includes('Database setup issue') || 
            error.includes('Database error saving new user') ||
            error.includes('RLS Policy Error') ||
            error.includes('Database permissions issue') ||
            error.includes('Database schema issue') ||
            error.includes('schema cache')) {
          errorTitle = 'Database Setup Required';
          errorMessage = 'Your database needs the latest migration. Please run migration file "20250625013000_fix_schema_cache_final.sql" in your Supabase dashboard SQL Editor.';
          showMigrationButton = true;
        } else if (error.includes('Database connection issue')) {
          errorTitle = 'Connection Issue';
          errorMessage = 'Unable to connect to the database. Please check your internet connection and Supabase configuration.';
        } else if (error.includes('Username is already taken')) {
          errorTitle = 'Username Taken';
          errorMessage = 'This username is already taken. Please choose a different one.';
        } else if (error.includes('phone number already exists')) {
          errorTitle = 'Phone Already Registered';
          errorMessage = 'An account with this phone number already exists. Please sign in instead.';
        } else if (error.includes('Password must be at least')) {
          errorTitle = 'Weak Password';
          errorMessage = 'Your password must be at least 6 characters long.';
        } else if (error.includes('Invalid phone')) {
          errorTitle = 'Invalid Phone Number';
          errorMessage = 'Please enter a valid phone number.';
        }
        
        const buttons = [
          { text: 'Try Again' },
          ...(error.includes('phone number already exists') ? [
            { text: 'Sign In Instead', onPress: () => router.push('/auth/sign-in') }
          ] : []),
          ...(showMigrationButton ? [
            { text: 'Migration Help', onPress: () => console.log('Run migration: 20250625013000_fix_schema_cache_final.sql in Supabase dashboard') }
          ] : [])
        ];
        
        Alert.alert(errorTitle, errorMessage, buttons);
      }
    } catch (unexpectedError) {
      console.error('🎯 SignUp: Unexpected error:', unexpectedError);
      Alert.alert(
        'Unexpected Error',
        'Something went wrong. Please check your database setup and try again.',
        [
          { text: 'OK' },
          { text: 'Setup Help', onPress: () => console.log('Check SETUP_INSTRUCTIONS.md') }
        ]
      );
    }
  };

  const navigateToSignIn = () => {
    router.push('/auth/sign-in');
  };

  const navigateToDemo = () => {
    router.replace('/(tabs)');
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

          {/* Configuration Warning */}
          {!isConfigured && (
            <View style={[styles.warningContainer, { backgroundColor: '#FFA500' + '20', borderColor: '#FFA500' }]}>
              <Database size={20} color="#FFA500" />
              <View style={styles.warningTextContainer}>
                <Text style={[styles.warningTitle, { color: '#FFA500' }]}>
                  Database Setup Required
                </Text>
                <Text style={[styles.warningText, { color: '#FFA500' }]}>
                  Run migration 20250625013000_fix_schema_cache_final.sql in Supabase or try demo mode
                </Text>
              </View>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: '#FF4444' + '20', borderColor: '#FF4444' }]}>
              <AlertCircle size={20} color="#FF4444" />
              <Text style={[styles.errorText, { color: '#FF4444' }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Phone size={20} color={themeColors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Phone Number (e.g., +1234567890)"
                  placeholderTextColor={themeColors.subtext}
                  value={phone}
                  onChangeText={formatPhoneNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {phone && !validatePhone(phone) && (
                <Text style={[styles.helperText, { color: '#FF4444' }]}>
                  Please enter a valid phone number
                </Text>
              )}
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

            {/* Demo Mode Button */}
            <Pressable
              style={[styles.demoButton, { borderColor: themeColors.border }]}
              onPress={navigateToDemo}
            >
              <Text style={[styles.demoButtonText, { color: themeColors.text }]}>
                Try Demo Mode
              </Text>
            </Pressable>

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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
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
  demoButton: {
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '600',
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