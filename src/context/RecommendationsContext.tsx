import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  Filters,
  NewRecommendationInput,
  Recommendation,
} from '@/types';
import { getBackend } from '@/services';
import type { RecommendationPatch } from '@/services';
import { DEFAULT_FILTERS } from '@/services/filters';
import { useAuth } from './AuthContext';

const PAGE_SIZE = 6;

interface RecommendationsContextValue {
  /** The currently visible page slice of the filtered results. */
  items: Recommendation[];
  /** The full filtered result set (e.g. for plotting every map pin). */
  all: Recommendation[];
  /** Total number of results matching the active filters. */
  totalCount: number;
  filters: Filters;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  setFilters: (update: Partial<Filters>) => void;
  resetFilters: () => void;
  refresh: () => Promise<void>;
  loadMore: () => void;
  toggleLike: (id: string) => Promise<void>;
  create: (input: NewRecommendationInput) => Promise<Recommendation>;
  update: (id: string, patch: RecommendationPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
  flag: (id: string, reason: string) => Promise<void>;
  /** Read a recommendation from the in-memory cache, if present. */
  getCached: (id: string) => Recommendation | undefined;
}

const RecommendationsContext = createContext<
  RecommendationsContextValue | undefined
>(undefined);

export function RecommendationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const backend = getBackend();
  const { user, isAuthenticated } = useAuth();
  const [filters, setFiltersState] = useState<Filters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchList = useCallback(
    async (mode: 'initial' | 'refresh') => {
      const id = ++requestId.current;
      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await backend.data.list(filters);
        if (id !== requestId.current) return; // a newer request superseded us
        setResults(data);
        setPage(1);
      } catch (e) {
        if (id !== requestId.current) return;
        setError(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [backend, filters],
  );

  // Refetch whenever filters change (or auth changes, to re-key like state).
  useEffect(() => {
    fetchList('initial');
  }, [fetchList, isAuthenticated]);

  const setFilters = useCallback((update: Partial<Filters>) => {
    setFiltersState((prev) => ({ ...prev, ...update }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState((prev) => ({
      ...DEFAULT_FILTERS,
      cityId: prev.cityId,
      sort: prev.sort,
    }));
  }, []);

  const refresh = useCallback(() => fetchList('refresh'), [fetchList]);

  const items = useMemo(
    () => results.slice(0, page * PAGE_SIZE),
    [results, page],
  );
  const hasMore = items.length < results.length;

  const loadMore = useCallback(() => {
    if (loadingMore || loading) return;
    if (items.length >= results.length) return;
    setLoadingMore(true);
    // Small delay keeps the spinner visible and mimics network pagination.
    setTimeout(() => {
      setPage((p) => p + 1);
      setLoadingMore(false);
    }, 180);
  }, [items.length, results.length, loadingMore, loading]);

  const replaceInResults = useCallback((rec: Recommendation) => {
    setResults((prev) => prev.map((r) => (r.id === rec.id ? rec : r)));
  }, []);

  const toggleLike = useCallback(
    async (id: string) => {
      // Optimistic update, with rollback on failure.
      let previous: Recommendation | undefined;
      setResults((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          previous = r;
          const likedByMe = !r.likedByMe;
          return {
            ...r,
            likedByMe,
            likeCount: Math.max(0, r.likeCount + (likedByMe ? 1 : -1)),
          };
        }),
      );
      try {
        const updated = await backend.data.toggleLike(id);
        replaceInResults(updated);
      } catch {
        if (previous) replaceInResults(previous);
      }
    },
    [backend, replaceInResults],
  );

  const create = useCallback(
    async (input: NewRecommendationInput) => {
      if (!user) throw new Error('You must be signed in to post.');
      const rec = await backend.data.create(input, user);
      setResults((prev) => [rec, ...prev]);
      return rec;
    },
    [backend, user],
  );

  const update = useCallback(
    async (id: string, patch: RecommendationPatch) => {
      const updated = await backend.data.update(id, patch);
      replaceInResults(updated);
    },
    [backend, replaceInResults],
  );

  const remove = useCallback(
    async (id: string) => {
      await backend.data.remove(id);
      setResults((prev) => prev.filter((r) => r.id !== id));
    },
    [backend],
  );

  const flag = useCallback(
    async (id: string, reason: string) => {
      await backend.data.flag(id, reason);
    },
    [backend],
  );

  const getCached = useCallback(
    (id: string) => results.find((r) => r.id === id),
    [results],
  );

  const value = useMemo<RecommendationsContextValue>(
    () => ({
      items,
      all: results,
      totalCount: results.length,
      filters,
      loading,
      refreshing,
      loadingMore,
      hasMore,
      error,
      setFilters,
      resetFilters,
      refresh,
      loadMore,
      toggleLike,
      create,
      update,
      remove,
      flag,
      getCached,
    }),
    [
      items,
      results,
      filters,
      loading,
      refreshing,
      loadingMore,
      hasMore,
      error,
      setFilters,
      resetFilters,
      refresh,
      loadMore,
      toggleLike,
      create,
      update,
      remove,
      flag,
      getCached,
    ],
  );

  return (
    <RecommendationsContext.Provider value={value}>
      {children}
    </RecommendationsContext.Provider>
  );
}

export function useRecommendations(): RecommendationsContextValue {
  const ctx = useContext(RecommendationsContext);
  if (!ctx)
    throw new Error(
      'useRecommendations must be used within a RecommendationsProvider',
    );
  return ctx;
}
