import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

interface BarBuddyLogoProps {
  size?: 'small' | 'medium' | 'large';
}

export default function BarBuddyLogo({ size = 'medium' }: BarBuddyLogoProps) {
  const dimensions = {
    small: {
      width: 80,
      height: 80,
    },
    medium: {
      width: 120,
      height: 120,
    },
    large: {
      width: 160,
      height: 160,
    },
  };

  const d = dimensions[size];

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://i.postimg.cc/sDqFhZHj/Untitled-design-1.png' }}
        style={[
          styles.logo,
          {
            width: d.width,
            height: d.height,
          }
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});