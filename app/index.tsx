import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, Text } from 'react-native';
import { colors } from '@/constants/colors';

export default function Index() {
  return <Redirect href="/(tabs)" />;
}