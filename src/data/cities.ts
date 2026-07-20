import type { City } from '@/types';

/**
 * Phase 1 launch cities across Thailand, Vietnam, Cambodia and Myanmar,
 * plus a couple of Phase 2 previews. Centres are approximate city cores.
 */
export const CITIES: City[] = [
  // ── Thailand ──
  {
    id: 'bangkok',
    name: 'Bangkok',
    country: 'Thailand',
    countryCode: 'TH',
    currency: 'THB',
    center: { latitude: 13.7563, longitude: 100.5018 },
  },
  {
    id: 'chiang-mai',
    name: 'Chiang Mai',
    country: 'Thailand',
    countryCode: 'TH',
    currency: 'THB',
    center: { latitude: 18.7883, longitude: 98.9853 },
  },
  {
    id: 'chiang-rai',
    name: 'Chiang Rai',
    country: 'Thailand',
    countryCode: 'TH',
    currency: 'THB',
    center: { latitude: 19.9105, longitude: 99.8406 },
  },
  {
    id: 'phuket',
    name: 'Phuket',
    country: 'Thailand',
    countryCode: 'TH',
    currency: 'THB',
    center: { latitude: 7.8804, longitude: 98.3923 },
  },
  {
    id: 'ayutthaya',
    name: 'Ayutthaya',
    country: 'Thailand',
    countryCode: 'TH',
    currency: 'THB',
    center: { latitude: 14.3532, longitude: 100.5689 },
  },
  // ── Vietnam ──
  {
    id: 'hanoi',
    name: 'Hanoi',
    country: 'Vietnam',
    countryCode: 'VN',
    currency: 'VND',
    center: { latitude: 21.0278, longitude: 105.8342 },
  },
  {
    id: 'ho-chi-minh',
    name: 'Ho Chi Minh City',
    country: 'Vietnam',
    countryCode: 'VN',
    currency: 'VND',
    center: { latitude: 10.7769, longitude: 106.7009 },
  },
  {
    id: 'hoi-an',
    name: 'Hoi An',
    country: 'Vietnam',
    countryCode: 'VN',
    currency: 'VND',
    center: { latitude: 15.8801, longitude: 108.338 },
  },
  // ── Cambodia ──
  {
    id: 'siem-reap',
    name: 'Siem Reap',
    country: 'Cambodia',
    countryCode: 'KH',
    currency: 'USD',
    center: { latitude: 13.3671, longitude: 103.8448 },
  },
  {
    id: 'phnom-penh',
    name: 'Phnom Penh',
    country: 'Cambodia',
    countryCode: 'KH',
    currency: 'USD',
    center: { latitude: 11.5564, longitude: 104.9282 },
  },
  // ── Myanmar ──
  {
    id: 'yangon',
    name: 'Yangon',
    country: 'Myanmar',
    countryCode: 'MM',
    currency: 'MMK',
    center: { latitude: 16.8409, longitude: 96.1735 },
  },
  {
    id: 'mandalay',
    name: 'Mandalay',
    country: 'Myanmar',
    countryCode: 'MM',
    currency: 'MMK',
    center: { latitude: 21.9588, longitude: 96.0891 },
  },
];

const byId = new Map<string, City>(CITIES.map((c) => [c.id, c]));

export function getCity(id: string | null | undefined): City | undefined {
  if (!id) return undefined;
  return byId.get(id);
}

/** Cities grouped by country, for the city picker. */
export function citiesByCountry(): { country: string; cities: City[] }[] {
  const groups = new Map<string, City[]>();
  for (const city of CITIES) {
    const list = groups.get(city.country) ?? [];
    list.push(city);
    groups.set(city.country, list);
  }
  return Array.from(groups.entries()).map(([country, cities]) => ({
    country,
    cities,
  }));
}
