import type {
  Author,
  Filters,
  NewRecommendationInput,
  Recommendation,
} from '@/types';

/** A signed-in user session. */
export interface Session {
  user: Author;
  /** How they authenticated. */
  provider: 'email' | 'google' | 'apple' | 'guest';
}

export type AuthProvider = 'google' | 'apple';

/** Profile fields a user can edit. */
export interface ProfilePatch {
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  homeBase?: string | null;
}

/**
 * Authentication contract. The offline backend implements a mock version;
 * the Supabase backend maps these to Supabase Auth. Screens only ever depend
 * on this interface, never on a concrete provider.
 */
export interface AuthBackend {
  getSession(): Promise<Session | null>;
  signInWithEmail(email: string, password: string): Promise<Session>;
  signUpWithEmail(
    email: string,
    password: string,
    displayName: string,
  ): Promise<Session>;
  signInWithProvider(provider: AuthProvider): Promise<Session>;
  continueAsGuest(): Promise<Session>;
  updateProfile(patch: ProfilePatch): Promise<Author>;
  signOut(): Promise<void>;
}

/** Fields a user may edit on their own recommendation. */
export type RecommendationPatch = Partial<
  Pick<
    Recommendation,
    | 'title'
    | 'description'
    | 'category'
    | 'rating'
    | 'costAmount'
    | 'costCurrency'
    | 'tags'
    | 'imageUrl'
    | 'location'
    | 'locationLabel'
    | 'cityId'
  >
>;

/**
 * Data contract for recommendations. Swap the implementation (offline vs.
 * Supabase/Firebase) without touching any screen.
 */
export interface DataBackend {
  list(filters: Filters): Promise<Recommendation[]>;
  getById(id: string): Promise<Recommendation | null>;
  listByAuthor(authorId: string): Promise<Recommendation[]>;
  create(
    input: NewRecommendationInput,
    author: Author,
  ): Promise<Recommendation>;
  update(id: string, patch: RecommendationPatch): Promise<Recommendation>;
  remove(id: string): Promise<void>;
  toggleLike(id: string): Promise<Recommendation>;
  /** Basic MVP moderation: flag content for review. */
  flag(id: string, reason: string): Promise<void>;
}

export interface Backend {
  readonly name: 'local' | 'supabase';
  readonly auth: AuthBackend;
  readonly data: DataBackend;
}
