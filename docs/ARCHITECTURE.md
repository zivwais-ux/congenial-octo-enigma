# Architecture

A single Expo (React Native) + TypeScript codebase targeting iOS, Android and
web. The guiding principle: **screens never know which backend they talk to.**

## Layers

```
┌──────────────────────────────────────────────────────────┐
│  app/  — Expo Router screens (presentation only)           │
│  • Discover / Map / Add / Profile / Detail / Auth          │
└───────────────▲───────────────────────▲──────────────────┘
                │ hooks                  │ hooks
┌───────────────┴───────────┐ ┌─────────┴──────────────────┐
│ context/AuthContext        │ │ context/RecommendationsCtx │
│ • session, sign in/out     │ │ • feed, filters, paging,   │
│                            │ │   like/create/delete       │
└───────────────▲───────────┘ └─────────▲──────────────────┘
                │ interface               │ interface
┌───────────────┴─────────────────────────┴──────────────────┐
│  services/  — Backend abstraction                            │
│  getBackend(): { auth: AuthBackend, data: DataBackend }      │
│  ├── localBackend     (AsyncStorage + seed, default)         │
│  ├── supabaseBackend  (scaffold; complete in docs/SETUP.md)  │
│  └── filters.ts       (pure applyFilters, shared by both)    │
└──────────────────────────────────────────────────────────────┘
```

## Key decisions

**Backend behind an interface.** `src/services/types.ts` defines `DataBackend`
and `AuthBackend`. `getBackend()` returns the implementation chosen by
`EXPO_PUBLIC_DATA_BACKEND`. Swapping `local` → `supabase` requires no screen
changes. This satisfies the brief's "Firebase Realtime DB **or** Supabase" and
"Firebase Auth **or** Supabase Auth" optionality without lock-in.

**Pure, shared filtering.** `applyFilters()` is a pure function used by the
offline backend and by the Supabase adapter for client-side refinement, so
search/sort/filter behave identically everywhere and are trivially testable.

**State via Context (per the brief).** Two providers: `AuthContext` (session)
and `RecommendationsContext` (feed, filters, pagination, optimistic likes,
create/update/delete). No external state library.

**File-based routing (Expo Router).** Auth is gated at the group layout level:
`(auth)/_layout` redirects authenticated users out; `(tabs)/_layout` redirects
unauthenticated users to sign-in. `app/index.tsx` is the entry gate.

**Platform-specific maps.** `MapPanel.native.tsx` uses `react-native-maps`
(Google Maps). Metro resolves `MapPanel.tsx` on web instead — a spatial
pin-layout fallback that needs no native module and no API key, so the web
bundle never imports `react-native-maps`.

**Theming.** `ThemeProvider` exposes a typed palette that follows the system
light/dark setting. All components read colours via `useTheme()`; no hard-coded
colours in screens.

**Offline-first & performance.** The default backend persists to AsyncStorage
and simulates latency so loading/refresh/empty/error states are all exercised in
development. Feed pagination is client-side (`PAGE_SIZE`) and swaps directly for
range queries against a real database.

## Data model

See `src/types/index.ts`. Core entities: `Recommendation`, `Author`, `City`,
`Filters`. Costs are stored in each city's local currency with a cross-currency
affordability band (`$`/`$$`/`$$$`) for comparable filtering.

## Testing the flow manually

1. Launch → sign in with any email/password (or Google/Apple/guest).
2. Discover → search, open filters, switch city, like a card.
3. Add → pick a photo, fill the form, publish → lands on the detail screen.
4. Profile → see your new post, edit your profile, delete a post.
5. Map → tap a pin to preview, tap the preview to open detail.
6. Toggle system dark mode → the whole UI adapts.
