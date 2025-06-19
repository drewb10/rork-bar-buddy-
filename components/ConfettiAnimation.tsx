import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  color: string;
}

export default function ConfettiAnimation() {
  const confettiPieces = useRef<ConfettiPiece[]>([]);
  const colors = ['#FF6A00', '#FF944D', '#FFD700', '#FF69B4', '#00CED1', '#32CD32'];

  useEffect(() => {
    // Create confetti pieces
    confettiPieces.current = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * screenWidth),
      y: new Animated.Value(-20),
      rotation: new Animated.Value(0),
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    // Animate confetti
    const animations = confettiPieces.current.map((piece) => {
      return Animated.parallel([
        Animated.timing(piece.y, {
          toValue: screenHeight + 100,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(piece.x, {
          toValue: piece.x._value + (Math.random() - 0.5) * 200,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(piece.rotation, {
            toValue: 360,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          { iterations: -1 }
        ),
      ]);
    });

    Animated.stagger(50, animations).start();
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.current.map((piece) => (
        <Animated.View
          key={piece.id}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: piece.color,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});