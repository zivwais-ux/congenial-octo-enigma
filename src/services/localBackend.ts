import type {
  Author,
  Filters,
  NewRecommendationInput,
  Recommendation,
} from '@/types';
import { createId } from '@/utils/id';
import { DEMO_USER, SEED_RECOMMENDATIONS } from '@/data/seed';
import { applyFilters } from './filters';
import { storage, STORAGE_KEYS } from './storage';
import type {
  AuthBackend,
  AuthProvider,
  Backend,
  DataBackend,
  ProfilePatch,
  RecommendationPatch,
  Session,
} from './types';

/**
 * Offline backend: seeds realistic data, persists everything on-device with
 * AsyncStorage, and mocks authentication. Requires zero configuration, so the
 * app is fully usable the moment it is installed. Every method mirrors the
 * shape a real network backend would return.
 */

// Simulate a little latency so loading states are exercised in development.
const LATENCY_MS = 220;
const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

async function loadAll(): Promise<Recommendation[]> {
  const existing = await storage.get<Recommendation[]>(
    STORAGE_KEYS.recommendations,
  );
  if (existing && existing.length) return existing;
  await storage.set(STORAGE_KEYS.recommendations, SEED_RECOMMENDATIONS);
  return SEED_RECOMMENDATIONS;
}

async function saveAll(recs: Recommendation[]): Promise<void> {
  await storage.set(STORAGE_KEYS.recommendations, recs);
}

class LocalDataBackend implements DataBackend {
  async list(filters: Filters): Promise<Recommendation[]> {
    const all = await loadAll();
    return delay(applyFilters(all, filters));
  }

  async getById(id: string): Promise<Recommendation | null> {
    const all = await loadAll();
    return delay(all.find((r) => r.id === id) ?? null);
  }

  async listByAuthor(authorId: string): Promise<Recommendation[]> {
    const all = await loadAll();
    const mine = all
      .filter((r) => r.author.id === authorId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    return delay(mine);
  }

  async create(
    input: NewRecommendationInput,
    author: Author,
  ): Promise<Recommendation> {
    const all = await loadAll();
    const rec: Recommendation = {
      ...input,
      id: createId(),
      author,
      likeCount: 0,
      likedByMe: false,
      createdAt: new Date().toISOString(),
    };
    const next = [rec, ...all];
    await saveAll(next);
    return delay(rec);
  }

  async update(
    id: string,
    patch: RecommendationPatch,
  ): Promise<Recommendation> {
    const all = await loadAll();
    let updated: Recommendation | null = null;
    const next = all.map((r) => {
      if (r.id !== id) return r;
      updated = { ...r, ...patch };
      return updated;
    });
    if (!updated) throw new Error('Recommendation not found');
    await saveAll(next);
    return delay(updated);
  }

  async remove(id: string): Promise<void> {
    const all = await loadAll();
    await saveAll(all.filter((r) => r.id !== id));
    return delay(undefined);
  }

  async toggleLike(id: string): Promise<Recommendation> {
    const all = await loadAll();
    let updated: Recommendation | null = null;
    const next = all.map((r) => {
      if (r.id !== id) return r;
      const likedByMe = !r.likedByMe;
      updated = {
        ...r,
        likedByMe,
        likeCount: Math.max(0, r.likeCount + (likedByMe ? 1 : -1)),
      };
      return updated;
    });
    if (!updated) throw new Error('Recommendation not found');
    await saveAll(next);
    return delay(updated);
  }

  async flag(id: string, reason: string): Promise<void> {
    const flags =
      (await storage.get<{ id: string; reason: string; at: string }[]>(
        STORAGE_KEYS.flags,
      )) ?? [];
    flags.push({ id, reason, at: new Date().toISOString() });
    await storage.set(STORAGE_KEYS.flags, flags);
    return delay(undefined);
  }
}

class LocalAuthBackend implements AuthBackend {
  async getSession(): Promise<Session | null> {
    return storage.get<Session>(STORAGE_KEYS.session);
  }

  private async persist(session: Session): Promise<Session> {
    await storage.set(STORAGE_KEYS.session, session);
    return delay(session);
  }

  private nameFromEmail(email: string): string {
    const handle = email.split('@')[0] ?? 'traveler';
    return handle
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  async signInWithEmail(email: string, _password: string): Promise<Session> {
    const existing = await this.getSession();
    const user: Author =
      existing?.user ?? {
        ...DEMO_USER,
        id: 'u_demo',
        displayName: this.nameFromEmail(email),
      };
    return this.persist({ user, provider: 'email' });
  }

  async signUpWithEmail(
    _email: string,
    _password: string,
    displayName: string,
  ): Promise<Session> {
    const user: Author = {
      ...DEMO_USER,
      displayName: displayName.trim() || DEMO_USER.displayName,
    };
    return this.persist({ user, provider: 'email' });
  }

  async signInWithProvider(provider: AuthProvider): Promise<Session> {
    const label = provider === 'google' ? 'Google Traveler' : 'Apple Traveler';
    const user: Author = { ...DEMO_USER, displayName: label };
    return this.persist({ user, provider });
  }

  async continueAsGuest(): Promise<Session> {
    return this.persist({ user: { ...DEMO_USER }, provider: 'guest' });
  }

  async updateProfile(patch: ProfilePatch): Promise<Author> {
    const session = await this.getSession();
    if (!session) throw new Error('Not signed in');
    const user: Author = { ...session.user, ...patch };
    await storage.set(STORAGE_KEYS.session, { ...session, user });
    return delay(user);
  }

  async signOut(): Promise<void> {
    await storage.remove(STORAGE_KEYS.session);
  }
}

export function createLocalBackend(): Backend {
  return {
    name: 'local',
    auth: new LocalAuthBackend(),
    data: new LocalDataBackend(),
  };
}
