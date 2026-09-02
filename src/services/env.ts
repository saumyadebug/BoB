/**
 * Environment variable validation for Supabase + Firebase.
 *
 * HOW TO USE:
 * 1. Create a `.env` file at the project root.
 * 2. Add the variables listed in `.env.example`.
 * 3. These are accessed via `process.env.EXPO_PUBLIC_*` (Expo SDK 49+).
 *
 * All keys are prefixed with EXPO_PUBLIC_ so they are bundled client-side.
 * DO NOT put secret keys here — these are all public-facing config values.
 */

const ENV = {
  // ─── Supabase ─────────────────────────────────────────────────────────────
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  SUPABASE_PROJECT_REF: process.env.EXPO_PUBLIC_SUPABASE_PROJECT_REF ?? '',

  // ─── Firebase (Firestore + FCM only — Auth dropped in Phase 1.5) ──────────
  // These can be empty during early dev; firebase.ts will skip init if so.
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
};

// Warn about missing Supabase (required), but not Firebase (optional in dev)
if (__DEV__) {
  const supabaseMissing = [ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY].filter((v) => v === '');
  if (supabaseMissing.length > 0) {
    console.warn(
      '[StreakPact] Supabase env vars missing — auth + data calls will fail.\n' +
        'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
    );
  }

  const firebaseMissing = [
    ENV.FIREBASE_API_KEY,
    ENV.FIREBASE_PROJECT_ID,
    ENV.FIREBASE_APP_ID,
  ].filter((v) => v === '');
  if (firebaseMissing.length > 0 && firebaseMissing.length < 3) {
    console.warn(
      '[StreakPact] Firebase partially configured — real-time feed will be disabled until complete.\n' +
        'Set all Firebase env vars in .env'
    );
  }
}

export default ENV;
