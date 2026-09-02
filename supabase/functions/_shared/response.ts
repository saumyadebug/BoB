// supabase/functions/_shared/response.ts
// Standard JSON response helpers.

export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status: number = 400, details?: unknown): Response {
  return jsonResponse({ error: message, details }, status);
}
