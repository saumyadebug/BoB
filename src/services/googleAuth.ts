import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { AppError } from './errors';

WebBrowser.maybeCompleteAuthSession();

/**
 * Google OAuth via Supabase Auth.
 *
 * Flow:
 *   1. Generate a PKCE code verifier + challenge
 *   2. Open the Supabase-hosted Google OAuth page in the system browser
 *   3. Supabase redirects back to the app with a code
 *   4. We exchange the code for a session
 *
 * Setup prerequisites (do this in the Supabase dashboard before this works):
 *   - Authentication → Providers → Google → Enable
 *   - Paste the iOS / Android / Web OAuth client IDs
 *   - Add the redirect URI: <scheme>:/auth/callback (handled by makeRedirectUri)
 *
 * For the local Google client IDs, the user must register an OAuth client
 * at https://console.cloud.google.com → APIs & Services → Credentials.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

export function getGoogleClientId(): string {
  if (Platform.OS === 'ios') return GOOGLE_IOS_CLIENT_ID;
  if (Platform.OS === 'android') return GOOGLE_ANDROID_CLIENT_ID;
  return GOOGLE_WEB_CLIENT_ID;
}

export function isGoogleConfigured(): boolean {
  return Boolean(GOOGLE_WEB_CLIENT_ID || GOOGLE_IOS_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID);
}

const discovery = {
  authorizationEndpoint: `${SUPABASE_URL}/auth/v1/authorize`,
  tokenEndpoint: `${SUPABASE_URL}/auth/v1/token`,
};

/**
 * Initiate Google sign-in. Returns the session on success, throws on cancel/failure.
 *
 * This implementation does NOT use expo-auth-session's `useAuthRequest` hook
 * because we need a plain function-callable API (no React hook required).
 * We replicate the same PKCE + redirect flow manually.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!isGoogleConfigured()) {
    throw new AppError(
      'NOT_ALLOWED',
      'Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env.'
    );
  }

  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new AppError('NOT_ALLOWED', `Google client ID not set for platform ${Platform.OS}`);
  }

  const redirectUri = makeRedirectUri({
    scheme: 'streakpact',
    path: 'auth/callback',
  });

  // Generate PKCE verifier + challenge
  const codeVerifier = base64UrlEncode(await Crypto.getRandomBytesAsync(32));
  const codeChallenge = base64UrlEncode(
    new Uint8Array(
      await Crypto.digest(
        Crypto.CryptoDigestAlgorithm.SHA256,
        new TextEncoder().encode(codeVerifier)
      )
    )
  );

  const state = base64UrlEncode(await Crypto.getRandomBytesAsync(16));

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `${discovery.authorizationEndpoint}?${params.toString()}`;

  // Open browser and wait for redirect
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type !== 'success' || !result.url) {
    throw new AppError('NOT_ALLOWED', 'Google sign-in was cancelled.');
  }

  // Parse the redirect URL
  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    throw new AppError('NOT_ALLOWED', `Google: ${errorParam}`);
  }
  if (!code) {
    throw new AppError('NETWORK', 'Google sign-in: no code returned');
  }
  if (returnedState !== state) {
    throw new AppError('NOT_ALLOWED', 'Google sign-in: state mismatch (possible CSRF)');
  }

  // Exchange code for session via Supabase
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw new AppError('NETWORK', `Google: ${error.message}`);
  if (!data.session) {
    throw new AppError('NETWORK', 'Google: no session returned');
  }
  // useAuthSync will pick up the session via onAuthStateChange.
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function base64UrlEncode(bytes: Uint8Array): string {
  // Convert Uint8Array to base64 then make URL-safe
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
