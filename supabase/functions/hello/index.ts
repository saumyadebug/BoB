// supabase/functions/hello/index.ts
// Placeholder function — confirms Edge Function deployment works.

import { handleCors, corsHeaders } from '../_shared/cors.ts';
import { jsonResponse } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  return jsonResponse({
    ok: true,
    function: 'hello',
    version: '1.5.0',
    timestamp: new Date().toISOString(),
  });
});
