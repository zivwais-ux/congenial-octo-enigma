import type { Backend } from './types';

/**
 * Supabase backend adapter (scaffold).
 *
 * The offline `local` backend is the default and needs no setup. To go live
 * with a real, shared database:
 *
 *   1. Follow docs/SETUP.md to create the Supabase project, run the SQL schema,
 *      and configure Auth + Storage.
 *   2. Install the client:  npx expo install @supabase/supabase-js
 *   3. Set EXPO_PUBLIC_DATA_BACKEND=supabase plus EXPO_PUBLIC_SUPABASE_URL and
 *      EXPO_PUBLIC_SUPABASE_ANON_KEY in your `.env`.
 *   4. Implement the two adapters below against the `DataBackend` /
 *      `AuthBackend` contracts in ./types.ts. Because every screen depends only
 *      on those interfaces, nothing else in the app needs to change.
 *
 * A reference implementation outline lives in docs/SETUP.md. Until the client
 * is installed and the adapters are filled in, selecting this backend throws a
 * clear, actionable error rather than failing silently.
 */
export function createSupabaseBackend(): Backend {
  const notReady = (): never => {
    throw new Error(
      '[Street Eats Asia] The Supabase backend is selected but not yet ' +
        'implemented. Install @supabase/supabase-js and complete the adapters ' +
        'in src/services/supabaseBackend.ts (see docs/SETUP.md), or set ' +
        'EXPO_PUBLIC_DATA_BACKEND=local to use the offline backend.',
    );
  };

  return {
    name: 'supabase',
    auth: {
      getSession: notReady,
      signInWithEmail: notReady,
      signUpWithEmail: notReady,
      signInWithProvider: notReady,
      continueAsGuest: notReady,
      updateProfile: notReady,
      signOut: notReady,
    },
    data: {
      list: notReady,
      getById: notReady,
      listByAuthor: notReady,
      create: notReady,
      update: notReady,
      remove: notReady,
      toggleLike: notReady,
      flag: notReady,
    },
  };
}
