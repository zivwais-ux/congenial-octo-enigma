/** Core domain types for Street Eats Asia. */

export type Category =
  | 'food'
  | 'attraction'
  | 'hidden-gem'
  | 'cultural'
  | 'other';

export type Tag =
  | 'vegan'
  | 'budget-friendly'
  | 'must-try'
  | 'local-specialty'
  | 'solo-friendly'
  | 'family-friendly';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  /** ISO 4217 currency for cost estimates, e.g. "THB". */
  currency: string;
  center: GeoPoint;
}

export interface Author {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  /** Where the traveler is from, e.g. "Berlin, DE". */
  homeBase?: string | null;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: Category;
  /** 1–5 whole stars. */
  rating: number;
  /** Estimated cost in the city's local currency (per person / per item). */
  costAmount: number;
  costCurrency: string;
  tags: Tag[];
  imageUrl: string;
  location: GeoPoint;
  /** Human-readable street-level location, e.g. "Soi 38, Sukhumvit". */
  locationLabel: string;
  cityId: string;
  author: Author;
  likeCount: number;
  /** Whether the *current* user has liked this. Client-side only. */
  likedByMe: boolean;
  createdAt: string; // ISO timestamp
}

/** Payload for creating a new recommendation (client -> data service). */
export interface NewRecommendationInput {
  title: string;
  description: string;
  category: Category;
  rating: number;
  costAmount: number;
  costCurrency: string;
  tags: Tag[];
  imageUrl: string;
  location: GeoPoint;
  locationLabel: string;
  cityId: string;
}

export type SortOption = 'recent' | 'most-liked' | 'highest-rated';

/** Coarse affordability band, comparable across currencies. */
export type CostBand = '$' | '$$' | '$$$';

export interface Filters {
  query: string;
  cityId: string | null;
  categories: Category[];
  tags: Tag[];
  minRating: number; // 0 = any
  maxBand: CostBand | null; // null = any; caps the affordability band
  sort: SortOption;
}

export interface CategoryMeta {
  id: Category;
  label: string;
  icon: string; // Ionicons name
}

export interface TagMeta {
  id: Tag;
  label: string;
  icon: string; // Ionicons name
}
