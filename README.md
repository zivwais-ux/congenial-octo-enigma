# 🍜 Street Eats Asia

**Traveler-to-traveler recommendations for street food, hidden gems, and
locally-owned spots across Asia** — the stalls the guidebooks, Google Maps and
TripAdvisor never list.

Street Eats Asia is a community-powered discovery app. Travelers who are *there
right now* share a photo, an honest recommendation, a rating, a rough cost and
an exact pin. That human-filtered layer of discovery is trustworthy, current,
hyperlocal and contextual in a way algorithmic platforms are not.

Built with **Expo (React Native) + TypeScript** for iOS, Android and web from a
single codebase.

---

## ✨ What's in this build

This repository is a complete, runnable MVP of the product brief. It runs with
**zero configuration** out of the box using an offline backend (realistic seed
data + on-device storage), and is architected so a real backend (Supabase or
Firebase) drops in behind a single interface without touching any screen.

### Implemented (MVP)

| Area | Status | Notes |
| --- | --- | --- |
| **Interactive map** | ✅ | Native Google Maps (`react-native-maps`); a spatial pin-layout fallback on web. City selector + tap-to-preview. |
| **Recommendation submission** | ✅ | Photo (camera/library), title, category, star rating, cost, description, tags, city, GPS pin. |
| **Feed & discovery** | ✅ | Infinite-scroll card feed, pull-to-refresh, like ❤️, share. |
| **Search & filtering** | ✅ | Full-text search; filter by category, tags, rating, price band; sort by recent / most-liked / highest-rated; city selection. |
| **User profile** | ✅ | Avatar, bio, home base, stats, your posts, edit profile, delete posts. |
| **Auth & user management** | ✅ | Email + Google/Apple + guest (mocked in the offline backend, real via Supabase Auth). Delete own posts, flag content for moderation. |
| **Design system** | ✅ | Warm gold / burnt orange / lime / deep teal palette, light + dark, 16px+ body, accessible contrast. |

### Deliberately Phase 2+ (per the brief)

Comments, following/activity feeds, bookmarks & collections, DMs, verification
badges, admin dashboard, multi-language, and monetization are **not** in the
MVP. The data model and navigation leave room for them.

> **Editing a recommendation's content:** the data layer exposes
> `update()` and it is fully wired for likes and profile edits; a dedicated
> edit-post form is the one intentionally-deferred CRUD surface. Deleting your
> own posts is implemented.

---

## 🚀 Quick start

```bash
# 1. Install dependencies
npm install

# 2. (optional) configure environment — the app runs fine without this
cp .env.example .env

# 3. Start the dev server
npm start          # then press i / a / w, or scan the QR with Expo Go
```

Platform shortcuts:

```bash
npm run ios        # iOS simulator (macOS)
npm run android    # Android emulator / device
npm run web        # browser
```

Quality gates:

```bash
npm run typecheck    # tsc --noEmit  (passes clean)
npm run export:web   # production web bundle to ./dist
```

**Requirements:** Node 18+, and Xcode (iOS) / Android Studio (Android) for
native builds. The map renders natively on device; on web it uses a spatial
fallback that needs no API key.

---

## 🧭 How it works

The app is **backend-agnostic**. Every screen depends only on two interfaces —
`DataBackend` and `AuthBackend` (`src/services/types.ts`). Two implementations
exist:

- **`local`** (default) — seeds realistic data, persists everything on-device
  with AsyncStorage, and mocks auth. No setup, works offline.
- **`supabase`** — a scaffolded adapter you complete once (see
  [`docs/SETUP.md`](docs/SETUP.md)). Selecting it changes nothing else in the app.

Switch backends with a single env var:

```bash
EXPO_PUBLIC_DATA_BACKEND=local      # default
EXPO_PUBLIC_DATA_BACKEND=supabase   # after completing docs/SETUP.md
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full picture.

---

## 📁 Project structure

```
app/                       # Expo Router routes (file-based navigation)
  _layout.tsx              # Providers + root stack, splash handling
  index.tsx                # Auth gate → tabs or sign-in
  (auth)/                  # sign-in, sign-up (redirects out when authed)
  (tabs)/                  # Discover (feed), Map, Add, Profile
  recommendation/[id].tsx  # Full recommendation detail
  +not-found.tsx
src/
  components/              # Reusable UI (Card, Button, Chip, MapPanel, …)
    MapPanel.tsx           #   web / fallback map (no native dep, no key)
    MapPanel.native.tsx    #   native Google Maps via react-native-maps
  context/                # AuthContext, RecommendationsContext
  services/               # Backend abstraction: types, local, supabase, filters
  data/                   # Seed data, cities, categories, tags
  theme/                  # Colors, typography, spacing, ThemeProvider
  types/                  # Domain types
  utils/                  # format (currency/time), geo (distance), id
assets/                   # Icons & splash
docs/                     # Setup, architecture, policies, analytics, onboarding
app.config.ts             # Dynamic Expo config (env-driven)
```

---

## 🎨 Design language

Vibrant, adventurous, culturally warm — photography-first, minimal text.

- **Colors:** burnt orange (`#F26A21`), warm gold (`#EEB015`), lime
  (`#6FB233`), deep teal (`#0E4D45`) on a warm paper background, with a full
  dark theme that follows the system setting.
- **Type:** bold, sans-serif, **body never below 16px**.
- **UX:** ≤ 3 taps to post, geolocation optional, ≥ AA contrast throughout.

---

## 🔐 Third-party integrations (documented, keys not committed)

- **Google Maps** — native map rendering. Add keys in `.env`
  (`GOOGLE_MAPS_IOS_API_KEY`, `GOOGLE_MAPS_ANDROID_API_KEY`); the web fallback
  needs none. See [`docs/SETUP.md`](docs/SETUP.md).
- **Supabase** *(or Firebase)* — database, auth, storage. See
  [`docs/SETUP.md`](docs/SETUP.md), which includes the full SQL schema and the
  adapter you fill in.
- **Analytics & Sentry** — wiring guide in [`docs/ANALYTICS.md`](docs/ANALYTICS.md).

No secrets live in the repo. `.env` is git-ignored; `.env.example` documents
every variable.

---

## 📚 Documentation

- [`docs/SETUP.md`](docs/SETUP.md) — Supabase/Firebase + Google Maps + build config
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the pieces fit together
- [`docs/ANALYTICS.md`](docs/ANALYTICS.md) — analytics events + Sentry
- [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — first-run user experience
- [`docs/PRIVACY_POLICY.md`](docs/PRIVACY_POLICY.md) — privacy policy **template**
- [`docs/TERMS_OF_SERVICE.md`](docs/TERMS_OF_SERVICE.md) — terms of service **template**

> The policy files are starting templates, not legal advice. Have counsel review
> before publishing.

---

## 🗺️ Launch geography

**Phase 1:** Thailand, Vietnam, Cambodia, Myanmar (seeded).
**Phase 2:** India, Spain, Mexico and beyond (add entries to `src/data/cities.ts`).

---

## 📄 License

MIT — see [`LICENSE`](LICENSE).
