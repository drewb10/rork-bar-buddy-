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
      width: 140,
      height: 140,
    },
    large: {
      width: 180,
      height: 180,
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
        onError={(error) => {
          console.warn('Logo failed to load:', error);
        }}
        defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
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