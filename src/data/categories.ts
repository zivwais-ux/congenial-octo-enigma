import type { Category, CategoryMeta } from '@/types';

export const CATEGORIES: CategoryMeta[] = [
  { id: 'food', label: 'Food', icon: 'restaurant' },
  { id: 'attraction', label: 'Attraction', icon: 'camera' },
  { id: 'hidden-gem', label: 'Hidden Gem', icon: 'sparkles' },
  { id: 'cultural', label: 'Cultural', icon: 'color-palette' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const byId = new Map<Category, CategoryMeta>(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: Category): CategoryMeta {
  return byId.get(id) ?? CATEGORIES[CATEGORIES.length - 1];
}
