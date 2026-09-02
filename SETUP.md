# StreakPact — Dev Setup (one-shot)

Run these in order. Everything you need is in this file — no docs to read.

## 1. Install the Supabase CLI

```powershell
# Windows (PowerShell, run as admin)
scoop install supabase
# OR
npm install -g supabase
```

## 2. Link the project to your Supabase account

```bash
# Login (opens browser, OAuth)
supabase login

# Link to the project. Use the ref from your .env: jvnzbnoljomuxzokwogo
supabase link --project-ref jvnzbnoljomuxzokwogo
```

When prompted for the database password, paste the one you set when creating the project.

## 3. Apply the database schema

This pushes both SQL files to your Supabase project in order.

```bash
supabase db push --db-url "$(grep SUPABASE_DB_URL .env || echo ask)"
```

If `--db-url` is rejected, use the manual route instead — see step 3b below.

### 3b. Manual SQL route (if CLI push fails)

1. Open https://app.supabase.com → your project → SQL Editor → "New query"
2. Open `docs/sql/schema.sql`, copy-paste, click **Run**
3. Open `docs/sql/0001_phase_1_5_fixes.sql`, copy-paste, click **Run**
4. Verify: in the Table Editor, you should see 8 tables (users, groups, group_members, activities, submissions, streaks, badges, user_badges, notifications) + 2 storage buckets

## 4. Deploy edge functions

```bash
supabase functions deploy hello
supabase functions deploy seed-dev
```

## 5. Run the dev seed

This creates 3 test users + 1 populated group. Idempotent — safe to re-run.

```bash
supabase functions invoke seed-dev --no-verify-jwt
```

Expected output:

```json
{
  "ok": true,
  "message": "Dev seed applied.",
  "users": { "alex@streakpact.app": "uuid-here", "...": "..." },
  "groupId": "uuid-here",
  "defaultPassword": "streakdev123",
  "hint": "Sign in with alex@streakpact.app / streakdev123"
}
```

## 6. Smoke test

```bash
# Boot the app
cd C:\Rishabh\BoB
npx expo start
```

Then in the app:
1. On the login screen, enter `alex@streakpact.app` / `streakdev123`
2. You should land on the Groups tab, see "Morning Hustle" with 2 members + 2 activities + 5 days of submissions
3. Tap the group → you should see Alex + Sarah, gym/read activity cards, with streak counters

## If something breaks

- **`function deploy` says "service_role not set"** → that's a CLI config thing; check `supabase/.temp/*` after `supabase link`
- **Seed says "permission denied"** → your account doesn't have admin on the project; double-check the project ref
- **App login fails with "Invalid API key"** → restart Metro (`Ctrl+C` then `npx expo start -c`); env vars hot-reload but cached sometimes
- **You see the user but the group is empty** → the seed inserted the group but the user_id on members is wrong; check the function's output for the userIds vs. group_members.user_id match

## That's the whole setup

After step 6, you're at "Phase 1.5 verified end-to-end". Tell me and I'll continue to Phase 2.
