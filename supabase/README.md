# Supabase Edge Functions

This directory contains the Supabase Edge Functions for StreakPact, deployed
to your Supabase project as Deno functions on the edge runtime.

## Structure

```
supabase/
├── config.toml                # Project config (used by `supabase` CLI)
├── functions/
│   ├── _shared/               # Code shared across functions
│   │   ├── cors.ts            # CORS headers
│   │   ├── response.ts        # JSON response helpers
│   │   ├── supabase-client.ts # Service-role + user-context clients
│   │   └── verify-jwt.ts      # JWT verification middleware
│   ├── hello/                 # Placeholder — deploys & responds
│   └── ...                     # (more added per phase)
```

## Local development

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
# Start the local stack
supabase start

# Serve a function locally
supabase functions serve hello --no-verify-jwt

# In another terminal, test it
curl http://localhost:54321/functions/v1/hello
```

## Deploy to production

```bash
# Deploy a single function
supabase functions deploy hello

# Deploy all functions
supabase functions deploy
```

## Environment variables

Functions in production have these env vars set automatically by Supabase:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

For local dev, these come from `supabase start`.

## Roadmap

| Function | Phase | Purpose |
|---|---|---|
| `hello` | 1.5 | Health check (deploy verification) |
| `award-xp` | 5 | Calculate + award XP for a new submission |
| `calculate-streaks` | 6 | Daily cron — recalculate streak counters |
| `evaluate-badges` | 8 | Award badges based on stats after submission |
| `send-push` | 9 | Wrap FCM sends for notification types |
| `weekly-wrapup` | 8 | Generate the Sunday 7 PM weekly recap card |

## Adding a new function

1. Create `supabase/functions/<name>/index.ts`
2. Import from `_shared/`: `handleCors`, `jsonResponse`, `errorResponse`, `verifyUser`
3. Local test: `supabase functions serve <name>`
4. Deploy: `supabase functions deploy <name>`
