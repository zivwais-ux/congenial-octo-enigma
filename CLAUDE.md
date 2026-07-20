# CLAUDE.md

Guidance for AI agents and new contributors working in this repository.

## What this is

Street Eats Asia — an Expo (React Native) + TypeScript app (iOS/Android/web)
for traveler-to-traveler street-food recommendations across Asia. See
`README.md` and `docs/ARCHITECTURE.md`.

## Commands

```bash
npm install          # install deps
npm start            # Expo dev server (press i/a/w)
npm run typecheck    # tsc --noEmit — keep this green
npm run export:web   # production web bundle (also a good build smoke test)
```

There is no unit-test suite yet; `typecheck` + `export:web` are the CI gates.
Run both before committing non-trivial changes.

## Conventions

- **Imports:** use the `@/*` alias for anything under `src/` (e.g.
  `import { Button } from '@/components'`). Configured in `tsconfig.json` and
  resolved by Metro automatically.
- **Colours & type:** never hard-code colours. Read them from `useTheme()` and
  use `<AppText variant=…>` / the `typography` scale. Body text stays ≥ 16px.
- **Backend calls:** screens must go through `useAuth()` /
  `useRecommendations()` or `getBackend()` — never import a concrete backend.
  Add capabilities to the `DataBackend`/`AuthBackend` interfaces first.
- **New screens:** add a route file under `app/` (Expo Router, file-based).
- **Maps:** keep `react-native-maps` out of the web bundle — native-only code
  goes in `*.native.tsx`, with a web-safe sibling `*.tsx`.
- **Secrets:** never commit them. Add new env vars to `.env.example` and read
  them via `app.config.ts` → `extra` (or `EXPO_PUBLIC_*`).

## Where things live

- `app/` routes · `src/components/` UI · `src/context/` state ·
  `src/services/` backend abstraction · `src/data/` seed/constants ·
  `src/theme/` design system · `src/utils/` helpers · `src/types/` domain types.

## Adding a city / category / tag

Edit `src/data/cities.ts`, `src/data/categories.ts`, or `src/data/tags.ts`.
Types are enforced by `src/types/index.ts`.
