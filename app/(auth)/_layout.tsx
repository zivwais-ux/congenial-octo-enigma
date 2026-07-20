import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { Loading, Screen } from '@/components';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
  const { initializing, isAuthenticated } = useAuth();

  if (initializing) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }
  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
