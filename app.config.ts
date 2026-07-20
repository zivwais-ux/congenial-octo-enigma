import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo config.
 *
 * Secrets and environment-specific values are read from environment variables
 * (see `.env.example`). Anything the client needs at runtime is exposed under
 * `extra` and read via `expo-constants`. Values prefixed with `EXPO_PUBLIC_`
 * are also inlined into the JS bundle automatically by Expo.
 *
 * None of these keys are committed. Copy `.env.example` -> `.env` and fill in
 * your own values, or configure them as EAS secrets for production builds.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Street Eats Asia',
  slug: 'street-eats-asia',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'streeteats',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.streeteats.asia',
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Street Eats Asia uses your location to show recommendations near you and to pin the spots you share.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.streeteats.asia',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#0E4D45',
    },
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
      },
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'CAMERA',
      'READ_MEDIA_IMAGES',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: '#0E4D45',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Street Eats Asia uses your location to show recommendations near you and to pin the spots you share.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Street Eats Asia needs access to your photos so you can add a picture to your recommendation.',
        cameraPermission:
          'Street Eats Asia needs access to your camera so you can snap a photo of the spot you are recommending.',
      },
    ],
  ],
  experiments: {
    // Typed routes are great, but require a generated types file. Left off so
    // `tsc` runs cleanly out of the box; enable once you wire up codegen.
    typedRoutes: false,
  },
  extra: {
    // Backend selection: 'local' (default, offline seed + AsyncStorage) or 'supabase'.
    dataBackend: process.env.EXPO_PUBLIC_DATA_BACKEND ?? 'local',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    // Web map fallback uses this key for a static map preview (optional).
    googleMapsWebApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY ?? '',
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  },
});
