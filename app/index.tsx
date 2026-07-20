import React from 'react';
import { Redirect } from 'expo-router';
import { Loading, Screen } from '@/components';
import { useAuth } from '@/context/AuthContext';

/** Entry gate: route to the app or to auth once the session is known. */
export default function Index() {
  const { initializing, isAuthenticated } = useAuth();

  if (initializing) {
    return (
      <Screen>
        <Loading label="Warming up the woks…" />
      </Screen>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/sign-in'} />;
}
