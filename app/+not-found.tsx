import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { EmptyState, Screen } from '@/components';

export default function NotFound() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen padded>
        <EmptyState
          icon="trail-sign-outline"
          title="Off the map"
          message="This page wandered off the beaten path. Let's get you back to the good food."
          actionLabel="Back to Discover"
          onAction={() => router.replace('/(tabs)')}
        />
      </Screen>
    </>
  );
}
