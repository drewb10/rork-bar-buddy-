import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Animated, Dimensions, Alert } from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAvatarStore } from '@/stores/avatarStore';
import { Palette, RotateCcw, Save, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Avatar component that renders a 3D-like avatar
const Avatar = ({ skinTone, hairType, hairColor }: { skinTone: string, hairType: string, hairColor: string }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  // Spin animation
  const startSpin = () => {
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      spinValue.setValue(0);
      startSpin();
    });
  };

  // Start spinning on mount
  React.useEffect(() => {
    startSpin();
  }, []);

  // Map the spin value to a rotation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Get the appropriate assets based on customization
  const getHairStyle = () => {
    switch (hairType) {
      case 'short':
        return styles.shortHair;
      case 'medium':
        return styles.mediumHair;
      case 'long':
        return styles.longHair;
      case 'curly':
        return styles.curlyHair;
      default:
        return styles.shortHair;
    }
  };

  return (
    <View style={styles.avatarContainer}>
      <LinearGradient
        colors={['rgba(255,106,0,0.2)', 'rgba(0,0,0,0)']}
        style={styles.avatarGlow}
      />
      
      <Animated.View
        style={[
          styles.avatarWrapper,
          { transform: [{ rotateY: spin }] }
        ]}
      >
        {/* Head */}
        <View style={[styles.head, { backgroundColor: skinTone }]}>
          {/* Eyes */}
          <View style={styles.eyes}>
            <View style={styles.eye} />
            <View style={styles.eye} />
          </View>
          
          {/* Mouth */}
          <View style={styles.mouth} />
          
          {/* Hair */}
          <View style={[getHairStyle(), { backgroundColor: hairColor }]} />
        </View>
        
        {/* Body - Fixed outfit */}
        <View style={styles.body}>
          <LinearGradient
            colors={[themeColors.primary, '#FF4500']}
            style={styles.shirt}
          />
        </View>
      </Animated.View>
    </View>
  );
};

export default function AvatarCustomizer() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { 
    avatar, 
    setSkinTone, 
    setHairType, 
    setHairColor,
    saveAvatar
  } = useAvatarStore();
  
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Available customization options
  const skinTones = [
    { id: 'light', color: '#FFE0BD' },
    { id: 'medium', color: '#E5C298' },
    { id: 'tan', color: '#C68642' },
    { id: 'brown', color: '#8D5524' },
    { id: 'dark', color: '#5C3836' },
  ];
  
  const hairTypes = [
    { id: 'short', name: 'Short' },
    { id: 'medium', name: 'Medium' },
    { id: 'long', name: 'Long' },
    { id: 'curly', name: 'Curly' },
  ];
  
  const hairColors = [
    { id: 'black', color: '#000000' },
    { id: 'brown', color: '#6A4E42' },
    { id: 'blonde', color: '#FFC56E' },
    { id: 'red', color: '#A52A2A' },
    { id: 'gray', color: '#AAAAAA' },
    { id: 'blue', color: '#4169E1' },
    { id: 'green', color: '#2E8B57' },
    { id: 'purple', color: '#800080' },
  ];

  const handleSaveAvatar = () => {
    saveAvatar();
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Preview */}
        <View style={[styles.previewContainer, { backgroundColor: themeColors.card }]}>
          <Avatar 
            skinTone={avatar.skinTone} 
            hairType={avatar.hairType} 
            hairColor={avatar.hairColor} 
          />
          
          <Text style={[styles.previewTitle, { color: themeColors.text }]}>
            Your Bar Buddy
          </Text>
        </View>
        
        {/* Customization Options */}
        <View style={styles.customizationContainer}>
          {/* Skin Tone */}
          <View style={[styles.optionSection, { backgroundColor: themeColors.card }]}>
            <View style={styles.optionHeader}>
              <Palette size={20} color={themeColors.primary} />
              <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                Skin Tone
              </Text>
            </View>
            
            <View style={styles.colorOptions}>
              {skinTones.map((tone) => (
                <Pressable
                  key={tone.id}
                  style={[
                    styles.colorOption,
                    { backgroundColor: tone.color },
                    avatar.skinTone === tone.color && styles.selectedOption,
                    avatar.skinTone === tone.color && { borderColor: themeColors.primary }
                  ]}
                  onPress={() => setSkinTone(tone.color)}
                >
                  {avatar.skinTone === tone.color && (
                    <Check size={16} color="white" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
          
          {/* Hair Type */}
          <View style={[styles.optionSection, { backgroundColor: themeColors.card }]}>
            <View style={styles.optionHeader}>
              <Palette size={20} color={themeColors.primary} />
              <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                Hair Type
              </Text>
            </View>
            
            <View style={styles.typeOptions}>
              {hairTypes.map((type) => (
                <Pressable
                  key={type.id}
                  style={[
                    styles.typeOption,
                    { backgroundColor: themeColors.background },
                    avatar.hairType === type.id && { borderColor: themeColors.primary, borderWidth: 2 }
                  ]}
                  onPress={() => setHairType(type.id)}
                >
                  <Text style={[
                    styles.typeText, 
                    { color: avatar.hairType === type.id ? themeColors.primary : themeColors.text }
                  ]}>
                    {type.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          
          {/* Hair Color */}
          <View style={[styles.optionSection, { backgroundColor: themeColors.card }]}>
            <View style={styles.optionHeader}>
              <Palette size={20} color={themeColors.primary} />
              <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                Hair Color
              </Text>
            </View>
            
            <View style={styles.colorOptions}>
              {hairColors.map((color) => (
                <Pressable
                  key={color.id}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.color },
                    avatar.hairColor === color.color && styles.selectedOption,
                    avatar.hairColor === color.color && { borderColor: themeColors.primary }
                  ]}
                  onPress={() => setHairColor(color.color)}
                >
                  {avatar.hairColor === color.color && (
                    <Check size={16} color={color.id === 'blonde' ? 'black' : 'white'} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
          
          {/* Coming Soon Section */}
          <View style={[styles.comingSoonSection, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.comingSoonTitle, { color: themeColors.text }]}>
              More Customization Coming Soon!
            </Text>
            <Text style={[styles.comingSoonText, { color: themeColors.subtext }]}>
              We're working on adding more options like outfits, accessories, and facial features. Stay tuned!
            </Text>
          </View>
          
          {/* Save Button */}
          <Pressable
            style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
            onPress={handleSaveAvatar}
          >
            <Save size={20} color="white" />
            <Text style={styles.saveButtonText}>Save Avatar</Text>
          </Pressable>
          
          {/* Reset Button */}
          <Pressable
            style={[styles.resetButton, { backgroundColor: themeColors.card }]}
            onPress={() => {
              Alert.alert(
                'Reset Avatar',
                'Are you sure you want to reset your avatar to default settings?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Reset', 
                    style: 'destructive',
                    onPress: () => {
                      setSkinTone(skinTones[0].color);
                      setHairType(hairTypes[0].id);
                      setHairColor(hairColors[0].color);
                    }
                  }
                ]
              );
            }}
          >
            <RotateCcw size={18} color={themeColors.subtext} />
            <Text style={[styles.resetButtonText, { color: themeColors.subtext }]}>
              Reset to Default
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <View style={styles.successMessageContainer}>
          <View style={[styles.successMessage, { backgroundColor: themeColors.primary }]}>
            <Check size={20} color="white" />
            <Text style={styles.successMessageText}>Avatar saved successfully!</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  previewContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  avatarContainer: {
    width: 200,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.8,
  },
  avatarWrapper: {
    alignItems: 'center',
  },
  head: {
    width: 100,
    height: 120,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  eyes: {
    flexDirection: 'row',
    width: 60,
    justifyContent: 'space-between',
    marginTop: 20,
  },
  eye: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000',
  },
  mouth: {
    width: 30,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
    marginTop: 15,
  },
  shortHair: {
    position: 'absolute',
    top: -10,
    width: 100,
    height: 40,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  mediumHair: {
    position: 'absolute',
    top: -15,
    width: 110,
    height: 50,
    borderTopLeftRadius: 55,
    borderTopRightRadius: 55,
  },
  longHair: {
    position: 'absolute',
    top: -15,
    width: 110,
    height: 80,
    borderTopLeftRadius: 55,
    borderTopRightRadius: 55,
  },
  curlyHair: {
    position: 'absolute',
    top: -20,
    width: 120,
    height: 60,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  body: {
    marginTop: -20,
    alignItems: 'center',
  },
  shirt: {
    width: 120,
    height: 80,
    borderRadius: 20,
  },
  customizationContainer: {
    paddingHorizontal: 16,
  },
  optionSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderWidth: 2,
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: width / 4 - 20,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  comingSoonSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  successMessageContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successMessageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});