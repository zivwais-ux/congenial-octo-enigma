import type { Tag, TagMeta } from '@/types';

export const TAGS: TagMeta[] = [
  { id: 'must-try', label: 'Must-try', icon: 'flame' },
  { id: 'local-specialty', label: 'Local Specialty', icon: 'ribbon' },
  { id: 'budget-friendly', label: 'Budget-friendly', icon: 'cash' },
  { id: 'vegan', label: 'Vegan', icon: 'leaf' },
  { id: 'solo-friendly', label: 'Solo-friendly', icon: 'person' },
  { id: 'family-friendly', label: 'Family-friendly', icon: 'people' },
];

const byId = new Map<Tag, TagMeta>(TAGS.map((t) => [t.id, t]));

export function getTag(id: Tag): TagMeta {
  return byId.get(id) ?? { id, label: id, icon: 'pricetag' };
}
