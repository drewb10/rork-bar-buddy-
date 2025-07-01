import React from 'react';
import { StyleSheet, View, Text, Pressable, Modal } from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Venue } from '@/types/venue';
import { formatTimeSlot } from '@/utils';

interface VenueModalsProps {
  venue: Venue;
  rsvpModalVisible: boolean;
  likeModalVisible: boolean;
  selectedTime: string | null;
  selectedLikeTime: string | null;
  timeSlots: string[];
  onTimeSelect: (time: string) => void;
  onLikeTimeSelect: (time: string) => void;
  onRsvpSubmit: () => void;
  onLikeSubmit: () => void;
  onCancel: (type: 'rsvp' | 'like') => void;
}

export default function VenueModals({
  venue,
  rsvpModalVisible,
  likeModalVisible,
  selectedTime,
  selectedLikeTime,
  timeSlots,
  onTimeSelect,
  onLikeTimeSelect,
  onRsvpSubmit,
  onLikeSubmit,
  onCancel,
}: VenueModalsProps) {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const ModalContent = ({ 
    title, 
    selectedValue, 
    onSelect, 
    onSubmit, 
    onCancelPress,
    submitText 
  }: {
    title: string;
    selectedValue: string | null;
    onSelect: (value: string) => void;
    onSubmit: () => void;
    onCancelPress: () => void;
    submitText: string;
  }) => (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { 
        backgroundColor: themeColors.glass?.background || themeColors.card,
        borderColor: themeColors.glass?.border || themeColors.border,
      }]}>
        <Text style={[styles.modalTitle, { color: themeColors.text }]}>
          {title}
        </Text>
        
        <View style={styles.timeSlotContainer}>
          {timeSlots.map((time, index) => (
            <Pressable
              key={index}
              style={[
                styles.timeSlot,
                { 
                  backgroundColor: selectedValue === time 
                    ? themeColors.primary 
                    : 'transparent',
                  borderColor: themeColors.primary
                }
              ]}
              onPress={() => onSelect(time)}
            >
              <Text 
                style={[
                  styles.timeSlotText, 
                  { color: selectedValue === time ? 'white' : themeColors.primary }
                ]}
              >
                {formatTimeSlot(time)}
              </Text>
            </Pressable>
          ))}
        </View>
        
        <View style={styles.modalActions}>
          <Pressable 
            style={[styles.modalButton, styles.cancelButton]} 
            onPress={onCancelPress}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          
          <Pressable 
            style={[
              styles.modalButton, 
              styles.submitButton, 
              { 
                backgroundColor: selectedValue ? themeColors.primary : themeColors.card,
                opacity: selectedValue ? 1 : 0.5
              }
            ]} 
            onPress={onSubmit}
            disabled={!selectedValue}
          >
            <Text style={styles.submitButtonText}>{submitText}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <>
      {/* RSVP Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rsvpModalVisible}
        onRequestClose={() => onCancel('rsvp')}
      >
        <ModalContent
          title={`What time are you heading to ${venue.name}?`}
          selectedValue={selectedTime}
          onSelect={onTimeSelect}
          onSubmit={onRsvpSubmit}
          onCancelPress={() => onCancel('rsvp')}
          submitText="Submit (+35 XP)"
        />
      </Modal>

      {/* Like Time Slot Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={likeModalVisible}
        onRequestClose={() => onCancel('like')}
      >
        <ModalContent
          title={`What time are you most likely to visit ${venue.name}?`}
          selectedValue={selectedLikeTime}
          onSelect={onLikeTimeSelect}
          onSubmit={onLikeSubmit}
          onCancelPress={() => onCancel('like')}
          submitText="Like This Bar 🔥"
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#999',
  },
  cancelButtonText: {
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  submitButton: {
    backgroundColor: '#FF6A00',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});