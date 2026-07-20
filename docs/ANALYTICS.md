# Analytics & Error Monitoring

The brief targets Firebase Analytics for behaviour tracking and Sentry for error
monitoring, tied to the success metrics (user growth, submission rate, retention,
session length, geographic diversity).

## Recommended event taxonomy

Instrument these events so the success metrics are measurable from day one:

| Event | When | Key properties |
| --- | --- | --- |
| `app_open` | cold/warm start | `is_authenticated` |
| `sign_up` | account created | `method` (email/google/apple) |
| `sign_in` | session started | `method` |
| `recommendation_view` | detail opened | `recommendation_id`, `city_id`, `category` |
| `recommendation_submit` | post published | `city_id`, `category`, `has_photo`, `has_gps`, `tag_count` |
| `recommendation_like` | like toggled | `recommendation_id`, `liked` |
| `search_performed` | query submitted | `query_length`, `result_count` |
| `filter_applied` | filters changed | `categories`, `tags`, `min_rating`, `max_band`, `sort` |
| `city_changed` | city selector | `city_id` |
| `share_tapped` | share sheet opened | `recommendation_id` |
| `content_flagged` | post reported | `recommendation_id` |

### Metric → event mapping

- **User growth** → `sign_up`
- **Submission rate (50/day)** → `recommendation_submit`
- **Quality (avg > 4.0★)** → `rating` distribution from `recommendation_submit`
- **Day-7 retention (> 40%)** → `app_open` cohorts
- **Geographic diversity (10+ cities)** → distinct `city_id` in `recommendation_submit`
- **Session length (> 3 min)** → session duration from `app_open`/backgrounding

## Wiring it up

A thin wrapper keeps analytics swappable and testable:

```ts
// src/services/analytics.ts  (create when ready)
export function track(event: string, props?: Record<string, unknown>) {
  if (__DEV__) return console.log('[track]', event, props);
  // firebase.analytics().logEvent(event, props)
}
```

Then call `track('recommendation_submit', {...})` from `AddScreen.onSubmit`,
`track('recommendation_like', {...})` from the like handlers, and so on. Keeping
all calls behind `track()` means no analytics SDK is imported directly by
screens.

### Firebase Analytics

```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
```

Add the config plugin and `google-services.json` / `GoogleService-Info.plist`
per the RN Firebase docs, then implement `track()` against `analytics()`.

### Sentry

```bash
npx expo install @sentry/react-native
```

Initialise once at app start using `EXPO_PUBLIC_SENTRY_DSN` (already exposed via
`app.config.ts` → `extra.sentryDsn`):

```ts
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const dsn = Constants.expoConfig?.extra?.sentryDsn;
if (dsn) Sentry.init({ dsn, tracesSampleRate: 0.2 });
```

Wrap the root layout export with `Sentry.wrap(RootLayout)` to capture render
errors.

## Privacy

Only collect what a metric needs. Do not attach precise location to analytics
events — city-level (`city_id`) is enough for geographic-diversity tracking. See
[`PRIVACY_POLICY.md`](PRIVACY_POLICY.md).
