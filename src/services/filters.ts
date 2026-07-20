import type { CostBand, Filters, Recommendation, SortOption } from '@/types';
import { costBand } from '@/utils/format';

export const DEFAULT_FILTERS: Filters = {
  query: '',
  cityId: null,
  categories: [],
  tags: [],
  minRating: 0,
  maxBand: null,
  sort: 'recent',
};

const BAND_RANK: Record<CostBand, number> = { $: 1, $$: 2, $$$: 3 };

/** True when any narrowing filter (beyond city + sort) is active. */
export function hasActiveFilters(f: Filters): boolean {
  return (
    f.query.trim().length > 0 ||
    f.categories.length > 0 ||
    f.tags.length > 0 ||
    f.minRating > 0 ||
    f.maxBand !== null
  );
}

export function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.categories.length) n += f.categories.length;
  if (f.tags.length) n += f.tags.length;
  if (f.minRating > 0) n += 1;
  if (f.maxBand !== null) n += 1;
  return n;
}

function sortRecs(recs: Recommendation[], sort: SortOption): Recommendation[] {
  const copy = [...recs];
  switch (sort) {
    case 'most-liked':
      return copy.sort((a, b) => b.likeCount - a.likeCount);
    case 'highest-rated':
      return copy.sort(
        (a, b) => b.rating - a.rating || b.likeCount - a.likeCount,
      );
    case 'recent':
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

/**
 * Pure, backend-agnostic filter + sort. Both the offline backend and the
 * Supabase backend (client-side refinement) reuse this so behaviour is
 * identical everywhere.
 */
export function applyFilters(
  recs: Recommendation[],
  filters: Filters,
): Recommendation[] {
  const q = filters.query.trim().toLowerCase();

  const filtered = recs.filter((rec) => {
    if (filters.cityId && rec.cityId !== filters.cityId) return false;
    if (filters.categories.length && !filters.categories.includes(rec.category))
      return false;
    if (filters.tags.length) {
      const hasAll = filters.tags.every((t) => rec.tags.includes(t));
      if (!hasAll) return false;
    }
    if (filters.minRating > 0 && rec.rating < filters.minRating) return false;
    if (filters.maxBand !== null && rec.costAmount > 0) {
      const band = costBand(rec.costAmount, rec.costCurrency);
      if (BAND_RANK[band] > BAND_RANK[filters.maxBand]) return false;
    }
    if (q) {
      const haystack = `${rec.title} ${rec.description} ${rec.locationLabel} ${rec.author.displayName}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return sortRecs(filtered, filters.sort);
}
