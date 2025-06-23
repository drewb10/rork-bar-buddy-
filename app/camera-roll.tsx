import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Pressable, StatusBar, Platform, Alert, Modal, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Trash2, Share2, X, Download } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useCameraRollStore } from '@/stores/cameraRollStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - 48) / 3; // 3 images per row with padding

export default function CameraRollScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { photos, removePhoto, clearAllPhotos } = useCameraRollStore();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const router = useRouter();

  const handlePhotoPress = (uri: string) => {
    setSelectedPhoto(uri);
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => removePhoto(photoId)
        }
      ]
    );
  };

  const handleClearAll = () => {
    if (photos.length === 0) return;
    
    Alert.alert(
      'Clear All Photos',
      'Are you sure you want to delete all photos? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: clearAllPhotos
        }
      ]
    );
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerBackTitle: 'Camera',
          headerTitle: 'Camera Roll',
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#FFFFFF',
        }} 
      />
      
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Header */}
        <View style={styles.header}>
          <BarBuddyLogo size="small" />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Your Camera Roll
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.subtext }]}>
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'} saved
          </Text>
        </View>

        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              No Photos Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.subtext }]}>
              Take some photos to see them here!
            </Text>
            <Pressable 
              style={[styles.backButton, { backgroundColor: themeColors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Back to Camera</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Clear All Button */}
            <View style={styles.actionContainer}>
              <Pressable 
                style={[styles.clearButton, { backgroundColor: themeColors.card }]}
                onPress={handleClearAll}
              >
                <Trash2 size={16} color="#FF4444" />
                <Text style={[styles.clearButtonText, { color: "#FF4444" }]}>
                  Clear All
                </Text>
              </Pressable>
            </View>

            {/* Photo Grid */}
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.photoGrid}
              showsVerticalScrollIndicator={false}
            >
              {photos.map((photo) => (
                <Pressable
                  key={photo.id}
                  style={styles.photoContainer}
                  onPress={() => handlePhotoPress(photo.uri)}
                >
                  <Image 
                    source={{ uri: photo.uri }} 
                    style={styles.photoThumbnail}
                  />
                  <View style={styles.photoOverlay}>
                    <Text style={styles.photoDate}>
                      {formatDate(photo.timestamp)}
                    </Text>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeletePhoto(photo.id)}
                    >
                      <Trash2 size={16} color="white" />
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* Full Screen Photo Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedPhoto}
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <View style={styles.modalOverlay}>
            <Pressable 
              style={styles.modalCloseArea}
              onPress={() => setSelectedPhoto(null)}
            />
            
            {selectedPhoto && (
              <View style={styles.modalContent}>
                <Image 
                  source={{ uri: selectedPhoto }} 
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
                
                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.modalButton, { backgroundColor: themeColors.card }]}
                    onPress={() => setSelectedPhoto(null)}
                  >
                    <X size={20} color={themeColors.text} />
                    <Text style={[styles.modalButtonText, { color: themeColors.text }]}>
                      Close
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  photoContainer: {
    width: imageSize,
    height: imageSize,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  photoDate: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '90%',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});