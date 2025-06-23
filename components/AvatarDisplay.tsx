import React, { useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { useAvatarStore } from '@/stores/avatarStore';
import { LinearGradient } from 'expo-linear-gradient';

interface AvatarDisplayProps {
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

export default function AvatarDisplay({ size = 'medium', animated = true }: AvatarDisplayProps) {
  const { avatar } = useAvatarStore();
  const spinValue = useRef(new Animated.Value(0)).current;
  
  // Size multipliers
  const sizeMultiplier = size === 'small' ? 0.6 : size === 'large' ? 1.5 : 1;
  
  // Base dimensions
  const headSize = 100 * sizeMultiplier;
  const containerSize = 200 * sizeMultiplier;
  
  // Spin animation
  React.useEffect(() => {
    if (animated) {
      const startSpin = () => {
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }).start(() => {
          spinValue.setValue(0);
          startSpin();
        });
      };
      
      startSpin();
    }
  }, [animated, spinValue]);
  
  // Map the spin value to a rotation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Get the appropriate hair style based on customization
  const getHairStyle = () => {
    const baseStyle = {
      position: 'absolute' as 'absolute',
      backgroundColor: avatar.hairColor,
    };
    
    switch (avatar.hairType) {
      case 'short':
        return {
          ...baseStyle,
          top: -10 * sizeMultiplier,
          width: headSize,
          height: 40 * sizeMultiplier,
          borderTopLeftRadius: 50 * sizeMultiplier,
          borderTopRightRadius: 50 * sizeMultiplier,
        };
      case 'medium':
        return {
          ...baseStyle,
          top: -15 * sizeMultiplier,
          width: headSize + 10 * sizeMultiplier,
          height: 50 * sizeMultiplier,
          borderTopLeftRadius: 55 * sizeMultiplier,
          borderTopRightRadius: 55 * sizeMultiplier,
        };
      case 'long':
        return {
          ...baseStyle,
          top: -15 * sizeMultiplier,
          width: headSize + 10 * sizeMultiplier,
          height: 80 * sizeMultiplier,
          borderTopLeftRadius: 55 * sizeMultiplier,
          borderTopRightRadius: 55 * sizeMultiplier,
        };
      case 'curly':
        return {
          ...baseStyle,
          top: -20 * sizeMultiplier,
          width: headSize + 20 * sizeMultiplier,
          height: 60 * sizeMultiplier,
          borderTopLeftRadius: 60 * sizeMultiplier,
          borderTopRightRadius: 60 * sizeMultiplier,
          borderBottomLeftRadius: 30 * sizeMultiplier,
          borderBottomRightRadius: 30 * sizeMultiplier,
        };
      default:
        return {
          ...baseStyle,
          top: -10 * sizeMultiplier,
          width: headSize,
          height: 40 * sizeMultiplier,
          borderTopLeftRadius: 50 * sizeMultiplier,
          borderTopRightRadius: 50 * sizeMultiplier,
        };
    }
  };

  return (
    <View style={[styles.container, { width: containerSize, height: containerSize }]}>
      <LinearGradient
        colors={['rgba(255,106,0,0.2)', 'rgba(0,0,0,0)']}
        style={[styles.glow, { width: containerSize * 1.2, height: containerSize * 1.2 }]}
      />
      
      <Animated.View
        style={[
          styles.avatarWrapper,
          animated ? { transform: [{ rotateY: spin }] } : {}
        ]}
      >
        {/* Head */}
        <View style={[
          styles.head, 
          { 
            backgroundColor: avatar.skinTone,
            width: headSize,
            height: headSize * 1.2,
            borderRadius: headSize / 2,
          }
        ]}>
          {/* Eyes */}
          <View style={[
            styles.eyes,
            {
              width: 60 * sizeMultiplier,
              marginTop: 20 * sizeMultiplier,
            }
          ]}>
            <View style={[
              styles.eye,
              {
                width: 12 * sizeMultiplier,
                height: 12 * sizeMultiplier,
                borderRadius: 6 * sizeMultiplier,
              }
            ]} />
            <View style={[
              styles.eye,
              {
                width: 12 * sizeMultiplier,
                height: 12 * sizeMultiplier,
                borderRadius: 6 * sizeMultiplier,
              }
            ]} />
          </View>
          
          {/* Mouth */}
          <View style={[
            styles.mouth,
            {
              width: 30 * sizeMultiplier,
              height: 10 * sizeMultiplier,
              borderRadius: 5 * sizeMultiplier,
              marginTop: 15 * sizeMultiplier,
            }
          ]} />
          
          {/* Hair */}
          <View style={getHairStyle()} />
        </View>
        
        {/* Body - Fixed outfit */}
        <View style={[
          styles.body,
          {
            marginTop: -20 * sizeMultiplier,
          }
        ]}>
          <LinearGradient
            colors={['#FF6A00', '#FF4500']}
            style={[
              styles.shirt,
              {
                width: 120 * sizeMultiplier,
                height: 80 * sizeMultiplier,
                borderRadius: 20 * sizeMultiplier,
              }
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    borderRadius: 120,
    opacity: 0.8,
  },
  avatarWrapper: {
    alignItems: 'center',
  },
  head: {
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
    justifyContent: 'space-between',
  },
  eye: {
    backgroundColor: '#000',
  },
  mouth: {
    backgroundColor: '#000',
  },
  body: {
    alignItems: 'center',
  },
  shirt: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});