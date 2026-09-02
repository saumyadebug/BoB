# StreakPact — Backend Completion Plan (Phases 1.5 → 4)

**Date:** 2026-08-29
**Scope:** Backend, data layer, business logic, auth wiring. UI is already done.
**Target:** All of Phases 1.5 through 4 fully wired and working with real data.

---

## Architectural decisions (locked)

| Decision | Choice | Why |
|---|---|---|
| **Auth provider** | **Supabase Auth** (drop Firebase Auth) | PRD's hybrid Firebase-Auth + Postgres was over-scoped. Supabase Auth = one source of truth, RLS works out of the box with `auth.uid()`, no JWT glue, faster to ship. Firebase stays for Firestore real-time + FCM only. |
| **User ID** | `auth.users.id` (UUID) — keep Firebase UID as `firebase_uid` column for the bridge | Lets us drop Firebase later; old references still resolve. |
| **Storage** | **Supabase Storage** for photos (was Firebase Storage) | Already a dep, free tier covers us, no second bucket. |
| **Edge Functions** | Set up the project structure now; build functions as we reach each phase | `supabase/functions/calculate-streaks`, `.../award-xp`, etc. Scaffolded with shared JWT-verify + CORS helpers. |
| **Real-time feed** | Keep Firestore (Phase 7 work) — Phase 4 doesn't need it | Phase 4 finishes on Supabase reads; we'll layer Firestore listeners when we hit Phase 7. |
| **Email verification** | Defer (PRD says "send verification email" but no UX mock in app) | UI has no resend-email screen; mark as Phase 9+ or note in a `TODO: AUTH HARDENING.md`. |
| **Google OAuth** | Defer to Phase 2.5 (after email/password works) | One screen, one OAuth client setup. Don't block Phase 2 on it. |
| **Avatar picker (12 presets + camera)** | Defer the 12 preset illustrations; ship a 4-emoji placeholder picker + camera upload only | PRD says "12 illustrated avatars" but no asset pipeline exists. Use generated SVG/colored circles + initials for now. |

---

## Honest state of the codebase today

What's actually working vs. aspirational in the `task.md`:

| Area | Real state |
|---|---|
| **SQL schema** | 320-line `docs/sql/schema.sql` — well designed, 8 tables, RLS, triggers, `pg_cron` template. **But the `groups` table has a column (`member_count`) that's not in the SQL — code expects it but schema doesn't have it.** |
| **Supabase client** | Wired (`src/services/supabase.ts`) with auth-storage adapter, photo upload helper. **But uses dummy `.env` keys.** |
| **Firebase client** | Wired (`src/services/firebase.ts`) with real-time listener helpers (group feed, reactions, comments, notifications, nudges). **But uses dummy `.env` keys.** |
| **`userService`** | `ensureCurrentUser` (upsert into `users`), `getUserById`. **But the `auth.uid()` in the RLS insert policy won't match a Firebase UID — this is the core auth gap.** |
| **`groupService`** | 530 lines. Full CRUD: `createGroup`, `joinGroupByCode`, `leaveGroup`, `updateGroup`, `removeMember`, `regenerateInviteCode`, `deleteGroup`, `addActivity`, `archiveActivity`, `fetchGroupWithMembers`, `fetchUserGroups`, `fetchGroupActivities`. Solid. **But: `addActivities` references `created_by` column not in schema; mirrorNewMemberNotification writes to Firestore notification collection (Phase 7 concern, not 3).** |
| **`useGroups` hooks** | 180 lines. 4 queries + 8 mutations, all wired to `queryClient` invalidation. Solid. |
| **Other hooks** | **`useCurrentUser`, `useActivities`, `useSubmissions`, `useStreaks` are MISSING.** Query keys exist in `queryClient.ts` but no hook files. |
| **Stores** | 5 Zustand stores exist (`useAuthStore`, `useGroupStore`, `useStreakStore`, `useNotificationStore`, `useSubmissionQueue`). But screens don't import them — they use mock data. The `useAuthStore.setUser` is the only one actually called. |
| **Screens → data** | Every screen has hardcoded mocks. **Not one screen hits the service layer.** |
| **Edge Functions** | `supabase/` directory doesn't exist. |
| **Firestore rules** | `docs/firestore.rules` is 116 lines but uses `group_members/{groupId}/{userId}` shape — not the Supabase schema. Needs rewrite. |
| **.env** | Both real `.env` and `.env.example` are filled with dummies. |

---

## Phase 1.5 — Foundation Cleanup (3–4 days)

**Why a new sub-phase:** Phase 1's `task.md` claims 30/32 done. The reality: 2 are not done and 6 more that were "done" are broken. Fix these before touching Phase 2.

### 1.5.1 — Drop Firebase Auth, migrate to Supabase Auth

**Scope:** ~1.5 days. Touches: `.env`, `services/firebase.ts`, `services/supabase.ts`, `store/useAuthStore.ts`, `App.tsx`, every screen that calls `signInWithEmailAndPassword`.

**Deliverables:**
1. `.env` / `.env.example`:
   - **Remove** all `EXPO_PUBLIC_FIREBASE_AUTH_*` keys.
   - **Add** `EXPO_PUBLIC_SUPABASE_PROJECT_REF`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (already there), `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_API_KEY` (only what's needed for Firestore + FCM, **not Auth**).
2. `services/firebase.ts`:
   - **Remove** `firebaseAuth`, `createFirebaseAuth()`, `getReactNativePersistence` (no longer needed).
   - **Keep** `firestore`, `COLLECTIONS`, `subscribeTo*` helpers (used Phase 7+).
   - Add Firebase Web API key only for the FCM SDK.
3. `services/supabase.ts`:
   - Verify `auth.persistSession` and `autoRefreshToken` are on (already are).
   - Remove `import { firebaseAuth } from './firebase'` from any service that imports it.
4. `store/useAuthStore.ts`:
   - Replace `User` shape: add `firebaseUid: string | null` for the bridge column.
   - Add `session: Session | null` (Supabase session) so we can call `supabase.auth.getSession()`.
5. `services/userService.ts`:
   - **Rewrite `ensureCurrentUser`** to use the current Supabase session, not Firebase.
   - The `id` in `users` table is now `auth.uid()` (the Supabase UUID), not a Firebase UID.
6. All `LoginScreen`, `RegisterScreen`, `SplashScreen`, `JoinOrCreateScreen`, `BiometricSetupScreen`:
   - Replace `signInWithEmailAndPassword(firebaseAuth, ...)` with `supabase.auth.signInWithPassword(...)`.
   - Replace `createUserWithEmailAndPassword(firebaseAuth, ...)` with `supabase.auth.signUp(...)`.
   - Replace `getIdToken()` calls with `supabase.auth.getSession().then(s => s.data.session?.access_token)`.

**Validation step:** Sign in, confirm `users` row appears in Supabase with the correct `auth.users.id`.

### 1.5.2 — Fix SQL schema gaps

**Scope:** ~0.5 day. The code expects columns/indexes that the schema doesn't define.

**Deliverables:**
1. Add to `groups` table: `member_count INTEGER NOT NULL DEFAULT 1 CHECK (member_count >= 1)`.
2. Add to `activities` table: `created_by TEXT REFERENCES public.users(id)`. Already FKs to groups; needs user FK.
3. Add indexes that code uses:
   - `idx_groups_invite_code` (for the join flow).
   - `idx_groups_admin_id` (for `requireAdmin`).
   - `idx_submissions_user_activity_date` (composite on `user_id, activity_id, client_timestamp` for calendar queries).
4. Fix the RLS insert policy on `users`: it currently requires `id = auth.uid()::TEXT` but Supabase UUIDs are like `a1b2c3d4-...`. **Change to `id = auth.uid()`** (no cast).
5. The `users` table constraint `CHECK (level BETWEEN 1 AND 7)` is wrong — PRD says 7 levels but the level progression is in the XP table, not enforced at the DB level. **Drop the check, or move it to an enum.**
6. The `groups.vibe` enum is `'hustle' | 'study' | 'gym' | 'custom'`, but the type says `'hustle' | 'study' | 'gym' | 'custom'`. The CreateGroupScreen passes 'hardcore' and 'relaxed' (from old `VIBES` constant). **Reconcile: update the type to `hustle | study | gym | relaxed | custom` and the SQL CHECK to match.**
7. Add `notifications` table (PRD has it in types but no table). Required for `mirrorNewMemberNotification` to use a single source of truth. Schema:
   ```sql
   CREATE TABLE public.notifications (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
     type TEXT NOT NULL,  -- matches NotificationType union
     title TEXT NOT NULL,
     body TEXT NOT NULL,
     deep_link TEXT,
     is_read BOOLEAN NOT NULL DEFAULT FALSE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```
   Add RLS: users see only their own.

**Output:** A new migration file `docs/sql/0001_phase_1_5_fixes.sql` — additive, idempotent, runnable in the Supabase SQL editor in one shot.

### 1.5.3 — Build the missing hooks

**Scope:** ~1 day. We have query keys for `currentUser`, `activities`, `submissions`, `streaks`, `badges` but only `useGroups` exists as a hook.

**Deliverables:**
1. `src/hooks/useCurrentUser.ts`:
   - `useCurrentUser()` — `useQuery(['currentUser'], fetchCurrentUser)`. `fetchCurrentUser` calls `supabase.from('users').select('*').eq('id', user.id).single()`.
   - `useUpdateProfile()` — mutation, invalidates `['currentUser']`.
2. `src/hooks/useActivities.ts`:
   - `useActivities(groupId)` — thin wrapper around `useGroupActivities`.
   - `useAddActivity()`, `useArchiveActivity()` — already exist in `useGroups.ts`, move here for cohesion.
3. `src/hooks/useSubmissions.ts` (stub): just exports the query keys for now; real fetcher in Phase 5.
4. `src/hooks/useStreaks.ts` (stub): same.
5. `src/hooks/useBadges.ts` (stub): same.
6. Refactor `useGroups.ts` to import from the new hooks barrel — no behavioral change.

**Validation step:** Add a debug screen (or just `console.log` in `HomeScreen` during dev) that shows `useCurrentUser().data` and `useUserGroups().data` from real Supabase. Confirm the queries succeed against a test seed.

### 1.5.4 — Scaffold Supabase Edge Functions

**Scope:** ~0.5 day. We won't write business logic yet — just the project structure.

**Deliverables:**
1. Initialize `supabase/` directory at the repo root with:
   ```
   supabase/
     functions/
       _shared/        # cors.ts, supabase-client.ts, verify-jwt.ts
       hello/          # placeholder so we can test deploy
     config.toml       # project config
     seed.sql          # dev-only seed (see 1.5.5)
   ```
2. `_shared/cors.ts` — standard CORS headers.
3. `_shared/supabase-client.ts` — factory that creates a service-role client (used by functions) and an anon client (for user-context).
4. `_shared/verify-jwt.ts` — `verifyUser(req): Promise<{ userId, email } | null>` that checks the `Authorization: Bearer <jwt>` against Supabase.
5. `hello/index.ts` — `GET /` returns `{ ok: true, version: '1.5.0' }`. Confirms deploy works.
6. Document in `docs/edge-functions.md` how to deploy: `supabase functions deploy hello`.

**Validation step:** Deploy `hello`, hit it with curl, see `{ok:true}`.

### 1.5.5 — Dev seed data

**Scope:** ~0.5 day. Without a seed, every manual test of Phase 2/3/4 requires creating real auth users.

**Deliverables:**
1. `supabase/seed.sql` — idempotent INSERT statements that create:
   - 3 fake auth users (use Supabase's `auth.users` insert trick via the `auth.admin.createUser` RPC, or document the manual step in SQL editor).
   - 2 groups, one with both users + admin, one empty.
   - 3 activities (gym, read, code) in the populated group.
   - 7 days of submissions for the "Alex" user to populate a streak.
2. A short `docs/seed-howto.md` (or update `PROJECT_CONTEXT.md`) describing: "After running `schema.sql`, run `seed.sql` to populate dev data. Log in as `alex@streakpact.app` / `streakalex`."

**Validation step:** Run the seed. Log in. See the dev group with members + activities + a non-zero streak.

### 1.5.6 — Wire `useAuthStore` to the actual session

**Scope:** ~0.5 day. The store has `setUser` but the screens bypass it (call `supabase.auth.signIn` directly, then `setUser` manually). This breaks any screen that needs the current user.

**Deliverables:**
1. Add a `supabase.auth.onAuthStateChange` listener at the App level that calls `setUser` automatically. (In `App.tsx` or a new `useAuthSync` hook.)
2. `useAuthStore.user` becomes the single source of truth — no more `setUser` calls in screens.
3. `useAuthStore.session` is set by the same listener.

**Validation step:** Log in → store populates. Log out → store clears. Refresh app → store rehydrates from `supabase.auth.getSession()`.

---

## Phase 2 — Authentication (3 days)

**Status of code already there:** All 7 auth screens exist, work, and pass typecheck. But they call Firebase Auth. After Phase 1.5, they call Supabase Auth but skip the user record creation. **Phase 2 fills the gap.**

### 2.1 — Real auth wiring (1.5 days)

**Files touched:** All 7 auth screens, `services/userService.ts`.

**Deliverables:**
1. **`LoginScreen`** — uses `supabase.auth.signInWithPassword({ email, password })`. On success, the `onAuthStateChange` listener (set up in 1.5.6) populates `useAuthStore`. Screen only handles loading/error UI.
2. **`RegisterScreen`** — uses `supabase.auth.signUp({ email, password, options: { data: { displayName: '' } } })`. On success, `setUser` for the partial session, navigate to `SetupProfile`.
3. **`SplashScreen`** — calls `supabase.auth.getSession()`. If session exists → call `fetchCurrentUser()` to populate `useAuthStore.user` → navigate to `Main`. Otherwise → `Onboarding` (or `Login` if `onboarding_completed` flag is set).
4. **`SetupProfileScreen`** — after form submit, call `userService.ensureCurrentUser({ username, displayName, avatarUrl })` which uses the `upsert` against `users` table. Avatar upload (if present) calls a new `userService.uploadAvatar(uri)` that uses Supabase Storage (`avatars/` bucket).
5. **`JoinOrCreateScreen`** — deep link handler reads the code from `Linking.parse(url)`, stores it in `useGroupStore.pendingInviteCode`, navigates to `JoinGroup`. After auth completes (either via register or login), `JoinGroup` reads the pending code and auto-fills.
6. **`BiometricSetupScreen`** — biometric setup is local-only (AsyncStorage flag). After enabling, navigate to `JoinOrCreate` (which checks for pending invite code).
7. Remove the "Continue as guest" button from `LoginScreen` (PRD never asked for guest mode; it's a leftover from the design exploration). **Or** keep it but wire it to a real `supabase.auth.signInAnonymously()` call (the `users` table has an FK to `auth.users` so this works). Decision: **keep + wire to anonymous auth.**

### 2.2 — Google OAuth (1 day)

**Files touched:** `LoginScreen`, `RegisterScreen`, `app.json` (URL scheme), new `services/oauth.ts`.

**Deliverables:**
1. Enable Google provider in Supabase dashboard.
2. `services/oauth.ts`:
   - `signInWithGoogle()` calls `supabase.auth.signInWithIdToken({ provider: 'google', token: <id_token> })`.
   - The id_token is obtained via `expo-auth-session` using the `useAuthRequest` hook.
   - The Google OAuth client ID goes in `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (per platform).
3. `LoginScreen` and `RegisterScreen` replace the "coming soon" stub buttons with `signInWithGoogle()`.
4. `app.json` updated with the URL scheme redirect: `"scheme": "streakpact"` (already set), plus the universal link for production.

### 2.3 — Form validation hardening (0.5 day)

**Files touched:** All 3 form screens.

**Deliverables:**
1. Move the inline Zod schemas into `src/validation/auth.ts` and re-export.
2. Add `confirmPassword` refinement to register schema (already there but move out).
3. Username availability check in `SetupProfileScreen`: debounce 400ms, query `users` table where `username = lower(input)`, show "taken" / "available" inline.
4. Add `passwordStrength` indicator (3 strength tiers) below the password field.

---

## Phase 3 — Groups & Memberships (3 days)

**Status of code already there:** All 6 group screens exist. `groupService.ts` is 530 lines and covers the full CRUD surface. `useGroups` has every hook. **The missing work is: connect screens to hooks, add the notification trigger, and write the integration tests.**

### 3.1 — Wire group screens to live data (1.5 days)

**Files touched:** `GroupsScreen`, `CreateGroupScreen`, `JoinGroupScreen`, `GroupHomeScreen`, `GroupSettingsScreen`, `useGroupStore.ts`.

**Deliverables:**
1. **`GroupsScreen`** — replace `useState(MOCK_GROUPS)` with `useUserGroups()`. Loading state shows `GroupCardSkeleton`. Empty state shows the existing `EmptyState` (with the `VoltPeek`). Add the FAB → BottomSheet that already exists.
2. **`CreateGroupScreen`** — wire the "Next" button at step 4 to call `useCreateGroup()`. On success, navigate to `GroupHome`. Replace the "generate fallback code" branches (currently used in catch) with a proper error toast.
3. **`JoinGroupScreen`** — wire to `useJoinGroup(code)`. Show specific error for `GROUP_FULL`, `NOT_FOUND`, `ALREADY_MEMBER` (all already in `AppErrorCode`).
4. **`GroupHomeScreen`** — replace `MOCK_GROUP` with `useGroup(groupId) + useGroupMembers(groupId) + useGroupActivities(groupId)`. Show `GroupCardSkeleton` during initial load. Show a tab-specific empty state when each tab's data is empty.
5. **`GroupSettingsScreen`** — wire to `useUpdateGroup()`, `useAddActivity()`, `useArchiveActivity()`, `useRegenerateInviteCode()`, `useDeleteGroup()`. Show confirmations as proper modals, not `Alert.alert`.
6. **`useGroupStore`** — wire to be a *client-side cache* of the React Query data (prepend-on-add for optimistic updates; remove on leave). Not a separate source of truth.

### 3.2 — Notification on new member (0.5 day)

**Files touched:** `groupService.ts`, new `services/notificationService.ts`.

**Deliverables:**
1. Replace `mirrorNewMemberNotification` (which writes to Firestore) with a call to `services/notificationService.create({ userId, type: 'new_group_member', ... })` that inserts into the new `notifications` table.
2. Add `notificationService.list(userId, { limit, unreadOnly })` for the future notification center.
3. Add `notificationService.markRead(id)`.

### 3.3 — QR code + deep link polish (0.5 day)

**Files touched:** `JoinGroupScreen`, `CreateGroupScreen` (step 5).

**Deliverables:**
1. Render invite code as a QR code using `react-native-qrcode-svg` (already installed). Display under the code in `CreateGroupScreen` step 5.
2. Add a "Scan QR" button in `JoinGroupScreen` that uses `expo-camera` barcode scanning. On scan, auto-fill the code field and trigger `useJoinGroup`.
3. Polish the share message: `"Join my StreakPact '{groupName}'! Code: {code}\nstreakpact://invite/{code}"`. Already present, just needs to be the same in both screens.

### 3.4 — Group streak calculation (0.5 day)

**Files touched:** `groupService.ts` (read-only helper), no new DB column needed.

**Deliverables:**
1. `groupService.getGroupStreak(groupId)`: count consecutive days where all current members have at least one submission. For now: 24-line Postgres function wrapped in an `rpc()` call. Or computed client-side from the activity submissions — start with client-side for speed, optimize later.
2. Display the result in `GroupHomeScreen` header.
3. **Defer real-time updates via pg_cron to Phase 6.** This is a one-shot read for the screen.

---

## Phase 4 — Activities & Templates (2 days)

**Status of code already there:** `activityTemplates.ts` has all 9 templates with full field definitions. `ActivityCard`, `ActivityDetail`, `CreateActivity` screens all exist. `addActivity` service is in `groupService.ts`. `DynamicForm` renders all 7 field types.

**Missing:** wire the create flow to the service, add an `updateActivity` (admin can edit), and harden the `DynamicForm`.

### 4.1 — Create activity flow (1 day)

**Files touched:** `CreateActivityScreen`, `groupService.ts`, `useGroups.ts`.

**Deliverables:**
1. The current `CreateActivityScreen` (8.1KB) is a step wizard. Wire the final "Add to Pact" button to `useAddActivity({ groupId, input: { name, icon, color, frequency, frequencyDays, requirePhoto, templateKey, templateFields } })`.
2. **Add `updateActivity` to `groupService.ts`:** `updateActivity(activityId, updates)` — same shape as `addActivity` minus `group_id`. Add `useUpdateActivity` hook.
3. Wire the edit flow in `ActivityDetailScreen` (admin only) to call `useUpdateActivity`.
4. **Add `unarchiveActivity`** alongside `archiveActivity` (admin accidentally archives → they need a recovery path). One-liner in `groupService`, one hook.

### 4.2 — Dynamic form hardening (0.5 day)

**Files touched:** `DynamicForm.tsx`.

**Deliverables:**
1. **Field-level error UI** — currently the form has block-level error text. Move to inline below each field.
2. **Character counters** on `text` and `number` fields that have a `maxLength` in the `FieldDefinition`. (Currently not supported — extend the schema.)
3. **Conditional field visibility** — add `showIf?: { fieldId, equals: any }` to `FieldDefinition`. e.g., "Show 'Other' text input if multiselect contains 'Other'".
4. **Persist field values across re-renders** — already handled by RHF, but the `defaultValues` only includes multiselect/toggle. Add defaults for text/number too (empty string / null).

### 4.3 — Activity templates cleanup (0.5 day)

**Files touched:** `activityTemplates.ts`, new `services/activityTemplateService.ts`.

**Deliverables:**
1. Move templates to the database. The PRD says "store as JSON config file" but if we ever want admin to add templates, they should live in a `activity_templates` table. **For Phase 4: keep them in code, but extract a `services/activityTemplateService.ts` that has the same shape (e.g., `getAll()`, `getById(id)`, `getByCategory(category)`) so the swap is trivial later.**
2. Add `category` to the template type (`'fitness' | 'learning' | 'mindfulness' | 'productivity' | 'lifestyle'`) — currently missing. Use it to group templates in the create screen.
3. **Validate the templates' `templateFields` IDs are unique within a template.** Add a build-time check or runtime validator.

---

## Cross-cutting concerns (apply to all phases above)

| Concern | Where | Decision |
|---|---|---|
| **Type safety of the service layer** | `services/*.ts` | Already have `AppError`. Add `ServiceResult<T>` pattern: `{ ok: true, data: T } | { ok: false, code, message }` for cases where callers want to handle errors without try/catch. **Optional — current try/catch is fine.** |
| **Optimistic updates** | hooks | `useCreateGroup`, `useAddActivity` should do optimistic cache writes (TanStack Query `onMutate`). Today they only invalidate after success. **Add in 3.1.** |
| **Error reporting** | App-wide | No Sentry yet. Add a thin `services/observability.ts` wrapper that `console.error`s for now; swap to Sentry later. **Defer to Phase 10.** |
| **i18n** | All screens | All copy is hardcoded English. **Defer entirely.** |
| **Accessibility** | UI components | Button has accessibilityRole, Card too. Inputs missing labels-for-id. **Add `accessibilityLabel` to all interactive elements in 1.5.3.** |
| **Offline support** | All queries | TanStack Query `networkMode: 'offlineFirst'` is set globally? No. **Set in 1.5.6.** |

---

## Out of scope (deliberately deferred)

- Phase 5+: submissions, calendar, streaks, social, gamification, notifications, profile
- Email verification flow
- Sentry / PostHog
- Tests (this plan adds features; tests are Phase 10)
- i18n
- Web OAuth flow (mobile-first; web uses email/password for now)

---

## Execution order (dependency graph)

```
1.5.1 (auth migration) ─┐
                        ├── 1.5.6 (auth state listener)
1.5.2 (schema fixes) ──┤
                        ├── 2.1 (real auth wiring)
1.5.3 (missing hooks) ─┤
                        │
1.5.4 (edge fn scaffold) ┴── 1.5.5 (seed data)
                                       │
                                       └── Phase 3 (groups)
                                              │
                                              └── Phase 4 (activities)
```

**Total estimate: ~12 working days (vs. 5.5 weeks estimated in `task.md`).** This is because most of the screens and service code already exist — we're filling the integration gaps, not building from scratch.

---

## Definition of done for each phase

A phase is "done" when:
1. Every screen that was mock-data is now hooked to a real query/mutation.
2. The service throws `AppError` with a code that the UI can branch on.
3. The RLS policy is updated to match any new read/write paths.
4. The SQL migration is in `docs/sql/000X_*.sql`, documented, runnable.
5. The auth flow is verified manually end-to-end (sign up → set up profile → create group → see group in list → open group → see activities).
6. TypeScript passes (`npx tsc --noEmit`).
7. Metro bundles for both Android and Web without errors.

Each phase ends with a demo of one full user flow. No phase merges until the demo is green.
