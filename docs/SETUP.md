# Setup Guide

The app runs with **zero configuration** on the offline `local` backend. This
guide covers going live with a real backend (Supabase or Firebase), Google Maps
keys, and production builds.

- [1. Environment variables](#1-environment-variables)
- [2. Google Maps](#2-google-maps)
- [3. Option A — Supabase (recommended)](#3-option-a--supabase-recommended)
- [4. Option B — Firebase](#4-option-b--firebase)
- [5. Production builds (EAS)](#5-production-builds-eas)

---

## 1. Environment variables

Copy the example file and fill in what you need:

```bash
cp .env.example .env
```

| Variable | Required when | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_DATA_BACKEND` | always (defaults to `local`) | `local` or `supabase` |
| `EXPO_PUBLIC_SUPABASE_URL` | `supabase` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `supabase` | Supabase anon/public key |
| `GOOGLE_MAPS_IOS_API_KEY` | native iOS maps | injected into `app.config.ts` |
| `GOOGLE_MAPS_ANDROID_API_KEY` | native Android maps | injected into `app.config.ts` |
| `EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY` | optional | web map fallback |
| `EXPO_PUBLIC_SENTRY_DSN` | optional | error monitoring |

Variables prefixed `EXPO_PUBLIC_` are inlined into the client bundle. Restart
the dev server after changing `.env`.

---

## 2. Google Maps

The **web** build uses a spatial fallback map that needs no key. **Native**
builds use `react-native-maps` (Google Maps), which needs API keys.

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a
   project and enable **Maps SDK for Android** and **Maps SDK for iOS**.
2. Create an API key per platform and restrict them:
   - Android → restrict to your package name `com.streeteats.asia` + signing SHA-1.
   - iOS → restrict to your bundle id `com.streeteats.asia`.
3. Put the keys in `.env`:
   ```bash
   GOOGLE_MAPS_IOS_API_KEY=...
   GOOGLE_MAPS_ANDROID_API_KEY=...
   ```
   `app.config.ts` reads them into `ios.config.googleMapsApiKey` and
   `android.config.googleMaps.apiKey`.
4. Rebuild the native app (`npx expo prebuild` then run), since native config
   changes require a fresh build.

---

## 3. Option A — Supabase (recommended)

### 3.1 Create the project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the **Project URL** and **anon public key** into `.env`:
   ```bash
   EXPO_PUBLIC_DATA_BACKEND=supabase
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

### 3.2 Database schema

Run this in the Supabase **SQL Editor**:

```sql
-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  home_base text,
  created_at timestamptz not null default now()
);

-- Recommendations
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade,
  title text not null,
  description text not null,
  category text not null check (category in
    ('food','attraction','hidden-gem','cultural','other')),
  rating int not null check (rating between 1 and 5),
  cost_amount numeric not null default 0,
  cost_currency text not null,
  tags text[] not null default '{}',
  image_url text not null,
  latitude double precision not null,
  longitude double precision not null,
  location_label text not null,
  city_id text not null,
  created_at timestamptz not null default now()
);

-- Likes (composite PK prevents double-likes)
create table public.likes (
  user_id uuid not null references public.profiles on delete cascade,
  recommendation_id uuid not null references public.recommendations on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recommendation_id)
);

-- Flags (basic moderation)
create table public.flags (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations on delete cascade,
  reporter_id uuid references public.profiles on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index on public.recommendations (city_id);
create index on public.recommendations (author_id);
create index on public.recommendations (created_at desc);
```

### 3.3 Row Level Security

```sql
alter table public.profiles        enable row level security;
alter table public.recommendations enable row level security;
alter table public.likes           enable row level security;
alter table public.flags           enable row level security;

-- Profiles: world-readable; you can only write your own.
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update" on public.profiles for update using (auth.uid() = id);

-- Recommendations: world-readable; author-only writes.
create policy "recs read"   on public.recommendations for select using (true);
create policy "recs insert" on public.recommendations for insert with check (auth.uid() = author_id);
create policy "recs update" on public.recommendations for update using (auth.uid() = author_id);
create policy "recs delete" on public.recommendations for delete using (auth.uid() = author_id);

-- Likes: readable; you manage your own.
create policy "likes read"   on public.likes for select using (true);
create policy "likes insert" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes delete" on public.likes for delete using (auth.uid() = user_id);

-- Flags: any authenticated user can file one.
create policy "flags insert" on public.flags for insert with check (auth.uid() = reporter_id);
```

### 3.4 Storage

Create a **public** bucket named `recommendation-photos`. Upload compressed
images from the client and store the resulting public URL in
`recommendations.image_url`.

### 3.5 Auth

Enable **Email**, **Google** and **Apple** providers under *Authentication →
Providers*. Configure the OAuth redirect URL to the app scheme `streeteats://`.

### 3.6 Complete the adapter

Install the client and fill in `src/services/supabaseBackend.ts`:

```bash
npx expo install @supabase/supabase-js
```

The file already implements the `Backend` shape with clear TODOs. Each method
maps 1:1 to a query, e.g.:

```ts
// list(filters)
const { data } = await supabase
  .from('recommendations')
  .select('*, author:profiles(*), likes(count)')
  .order('created_at', { ascending: false });
// then refine with the shared applyFilters(rows, filters) helper.
```

Because every screen depends only on the `DataBackend` / `AuthBackend`
interfaces, nothing else in the app changes.

---

## 4. Option B — Firebase

Prefer Firebase? The same interfaces apply — create
`src/services/firebaseBackend.ts` implementing `Backend` and register it in
`src/services/index.ts`.

- **Auth:** Firebase Auth (Email, Google, Apple).
- **Database:** Firestore collections `profiles`, `recommendations`, `likes`,
  `flags` mirroring the schema above (store `location` as a GeoPoint).
- **Storage:** Firebase Storage bucket for photos.
- **Install:** `npx expo install firebase`.

Secure it with Firestore Security Rules equivalent to the RLS policies above
(world-readable content, author-only writes).

---

## 5. Production builds (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure

# Store your secrets with EAS instead of committing them:
eas secret:create --name GOOGLE_MAPS_ANDROID_API_KEY --value ...
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value ...

eas build --platform ios       # TestFlight
eas build --platform android   # Google Play Beta
```

See the App Store / Play Store submission checklist in the brief's launch phase,
and `docs/ANALYTICS.md` before shipping.
