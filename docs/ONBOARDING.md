# User Onboarding

The first run is designed to reach real content fast — the brief's "≤ 3 taps to
submit" and "geolocation intuitive but optional" principles apply to onboarding
too.

## First-run flow

1. **Splash → Sign-in.** A warm, branded welcome. Three low-friction paths:
   - Email (6+ char password)
   - Google / Apple (one tap)
   - **Explore as a guest** — no account required to browse
2. **Discover immediately.** New users land on a populated feed (seeded in the
   offline backend; real content once a backend is connected), so the app never
   feels empty. City defaults to "All of Asia".
3. **First contribution.** The **Add** tab is always one tap away. The form is a
   single scroll: photo → title → category → rating → city → publish. Cost, GPS
   pin, street label and tags are optional.

## Permission priming

Permissions are requested **in context, only when needed** — never up front:

- **Camera / Photos** — requested the moment the user taps *Take photo* / *Upload*
  in the Add form.
- **Location** — requested only when the user taps *Use my current location*.
  Declining is fine; the pin falls back to the chosen city centre.

Each request carries a plain-language rationale (configured in `app.config.ts`
`infoPlist` / `permissions`).

## Copy guidelines

- Friendly, traveler-to-traveler tone ("Hungry, Mia?", "Share a spot").
- Explain *why* before asking for anything.
- Empty states always offer the next action (clear filters, add the first post).

## Ideas for a guided tour (Phase 2)

- A 3-card intro carousel (Discover · Add · Map) shown once, skippable.
- A gentle nudge to post after the user has viewed N recommendations.
- Convert guests to accounts at the moment they try to like or post.

These are intentionally out of the MVP but the navigation structure supports
dropping them in without rework.
