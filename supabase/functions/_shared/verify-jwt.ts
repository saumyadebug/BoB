// supabase/functions/_shared/verify-jwt.ts
// Verify the incoming Supabase Auth JWT and return the user id.
//
// Returns null if the request is unauthenticated. Callers should
// short-circuit with a 401 response in that case.

import { getUserClient } from './supabase-client.ts';

export interface AuthedUser {
  userId: string;
  email: string | null;
}

export async function verifyUser(req: Request): Promise<AuthedUser | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const supabase = getUserClient(req);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return { userId: data.user.id, email: data.user.email ?? null };
}

export function unauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
