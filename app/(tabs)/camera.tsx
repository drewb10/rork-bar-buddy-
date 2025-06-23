import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, StatusBar, Platform, Alert, Image } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, RotateCcw, Image as ImageIcon } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useAchievementStore } from '@/stores/achievementStore';
import { useCameraRollStore } from '@/stores/cameraRollStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { awardXP, profile } = useUserProfileStore();
  const { updateAchievementProgress } = useAchievementStore();
  const { addPhoto, getPhotoCount } = useCameraRollStore();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Loading camera...
          </Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.permissionContainer}>
          <BarBuddyLogo size="large" />
          <Text style={[styles.permissionTitle, { color: themeColors.text }]}>
            Camera Access Needed
          </Text>
          <Text style={[styles.permissionText, { color: themeColors.subtext }]}>
            Take photos at bars and earn XP for your nightlife adventures!
          </Text>
          <Pressable 
            style={[styles.permissionButton, { backgroundColor: themeColors.primary }]}
            onPress={requestPermission}
          >
            <Camera size={20} color="white" />
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        // Save photo locally
        const fileName = `barbuddy_${Date.now()}.jpg`;
        const localUri = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.copyAsync({
          from: photo.uri,
          to: localUri,
        });

        // Add to camera roll store
        addPhoto(localUri);
        
        setCapturedPhoto(localUri);
        
        // Award XP for taking a photo (10 XP)
        awardXP('photo_taken', 'Captured a nightlife moment!');
        
        // Update photo achievements
        const newPhotoCount = profile.photosTaken + 1;
        updateAchievementProgress('photo-enthusiast', newPhotoCount);
        updateAchievementProgress('photo-master', newPhotoCount);
        
        setShowSuccessModal(true);
        
        // Auto-hide success modal after 2 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          setCapturedPhoto(null);
        }, 2000);
      }
    } catch (error) {
      console.warn('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setShowSuccessModal(false);
  };

  const openCameraRoll = () => {
    router.push('/camera-roll');
  };

  if (capturedPhoto && showSuccessModal) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
        
        {/* Success Overlay */}
        <View style={styles.successOverlay}>
          <View style={[styles.successModal, { backgroundColor: themeColors.card }]}>
            <View style={[styles.successIcon, { backgroundColor: themeColors.primary }]}>
              <Camera size={32} color="white" />
            </View>
            <Text style={[styles.successTitle, { color: themeColors.text }]}>
              Great Shot! 📸
            </Text>
            <Text style={[styles.successSubtitle, { color: themeColors.subtext }]}>
              Photo saved to your camera roll!
            </Text>
          </View>
        </View>

        {/* Retake Button */}
        <Pressable 
          style={[styles.retakeButton, { backgroundColor: themeColors.card }]}
          onPress={retakePhoto}
        >
          <RotateCcw size={20} color={themeColors.text} />
          <Text style={[styles.retakeText, { color: themeColors.text }]}>
            Take Another
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
      >
        {/* Header */}
        <View style={styles.header}>
          <BarBuddyLogo size="medium" />
          <Text style={[styles.headerTitle, { color: 'white' }]}>
            Capture Your Night
          </Text>
        </View>

        {/* Bottom Controls - All three buttons */}
        <View style={styles.bottomControls}>
          <Pressable 
            style={[styles.sideButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
            onPress={toggleCameraFacing}
          >
            <RotateCcw size={24} color="white" />
            <Text style={styles.sideButtonText}>Flip</Text>
          </Pressable>

          <Pressable 
            style={[
              styles.captureButton, 
              { 
                backgroundColor: isCapturing ? themeColors.primary + '80' : themeColors.primary,
                transform: [{ scale: isCapturing ? 0.95 : 1 }]
              }
            ]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            <Camera size={32} color="white" />
          </Pressable>

          <Pressable 
            style={[styles.sideButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
            onPress={openCameraRoll}
          >
            <ImageIcon size={24} color="white" />
            <Text style={styles.sideButtonText}>
              Roll ({getPhotoCount()})
            </Text>
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sideButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    minWidth: 70,
  },
  sideButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  successModal: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retakeText: {
    fontSize: 16,
    fontWeight: '600',
  },
});