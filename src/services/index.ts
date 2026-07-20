import Constants from 'expo-constants';
import type { Backend } from './types';
import { createLocalBackend } from './localBackend';
import { createSupabaseBackend } from './supabaseBackend';

let instance: Backend | null = null;

function selectBackend(): Backend {
  const choice =
    (Constants.expoConfig?.extra?.dataBackend as string | undefined) ?? 'local';
  if (choice === 'supabase') return createSupabaseBackend();
  return createLocalBackend();
}

/** Singleton accessor for the active backend (local by default). */
export function getBackend(): Backend {
  if (!instance) instance = selectBackend();
  return instance;
}

export * from './types';
export { applyFilters, DEFAULT_FILTERS, hasActiveFilters, countActiveFilters } from './filters';
