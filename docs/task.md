# StreakPact — Task Tracker

**Last Updated:** August 23, 2026  
**Status:** Phase 0 — Planning Complete ✅  

**Legend:** `[ ]` Not Started · `[/]` In Progress · `[x]` Completed

---

## Phase 1: Foundation & Project Setup (1.5 weeks)

### 1.1 Project Initialization
- [x] Initialize Expo project with TypeScript template
- [x] Configure `tsconfig.json` with strict mode and path aliases
- [x] Set up ESLint + Prettier
- [x] Initialize Git repo, `.gitignore`, `develop`/`main` branches
- [x] Configure `app.json` / `app.config.ts` with metadata, splash, scheme

### 1.2 Navigation Architecture
- [x] Install React Navigation v7 (Stack + Bottom Tabs)
- [x] Create Auth Stack (Splash → Onboarding → Login → Register)
- [x] Create Main Tab Navigator (Home, Groups, Submit FAB, Leaderboard, Profile)
- [x] Implement center Submit tab as raised pill FAB
- [x] Configure deep linking for `streakpact://invite/:code`
- [x] Add screen transition animations

### 1.3 Design System Implementation
- [x] Create `constants/theme.ts` with Tactile Hardware tokens (colors, drop/inset shadows)
- [x] Install fonts: Inter, Roboto Mono
- [x] Build base components: Text, Button (with physical press states), Card (pillowy), Avatar, Badge, Chip, Input
- [x] Build StatusIndicator component (LED states)
- [x] Build skeleton loader components
- [x] Configure Tailwind neumorphic shadow utilities
- [x] Build animated components: StreakCounter (digital display), XPChip, ConfettiBurst
- [x] Create BottomSheet reusable component

### 1.4 Backend Infrastructure
- [x] Create Supabase project + configure env variables
- [x] Create Firebase project (Auth, Firestore, Cloud Messaging)
- [x] Create Supabase database tables (users, groups, group_members, activities, submissions, streaks, badges, user_badges)
- [x] Configure Row-Level Security (RLS) policies
- [x] Set up Supabase Storage bucket `submission-photos`
- [x] Create Firestore collections structure
- [x] Write Firestore security rules
- [x] Set up Supabase Edge Functions project

### 1.5 State Management & Data Layer
- [x] Install and configure Zustand stores
- [x] Install TanStack Query with QueryClient config
- [x] Create API service layer with Supabase/Firebase clients
- [x] Set up offline submission queue (AsyncStorage)
- [x] Create custom hooks: useCurrentUser, useGroups, useActivities, useSubmissions, useStreaks

---

## Phase 2: Authentication & Onboarding (1.5 weeks)

### 2.1 Splash Screen
- [x] Animated splash with Volt mascot Lottie
- [x] Auto-redirect logic (JWT check)
- [x] App version check

### 2.2 Onboarding Carousel
- [x] 3-slide animated value prop carousel
- [x] Parallax scroll animation on illustrations
- [x] Skip button + dot indicators + "Get Started" CTA
- [x] Store onboarding completion in AsyncStorage

### 2.3 Authentication Screens
- [x] Login screen (email/password + Google OAuth)
- [x] Register screen (email/password + Google OAuth)
- [x] Firebase Auth integration (create, login, Google sign-in)
- [x] Email verification flow
- [x] JWT token management (SecureStore)
- [x] Error handling (invalid credentials, existing email, network)
- [x] Form validation (React Hook Form + Zod)

### 2.4 Username & Avatar Setup
- [x] Username input with real-time availability check
- [x] Username validation (3–20 chars, alphanumeric + underscore)
- [x] Avatar picker (12 presets + camera upload)
- [x] Camera upload + crop + compress + upload to Supabase Storage
- [x] Create user record in Supabase `users` table

### 2.5 "Start a Pact or Join One" Screen
- [x] Two illustrated action cards with animated entrance
- [x] Deep link invite code auto-handling

### 2.6 Biometric Login
- [x] Expo LocalAuthentication integration
- [x] Settings toggle for enable/disable
- [x] Fallback to email/password

---

## Phase 3: Groups & Team Management (2 weeks)

### 3.1 Groups List Screen
- [x] Scrollable group list with GroupCard components
- [x] Group card: name, emoji, stacked avatars, activities count, submission status
- [x] Tap → Group Home; Long-press → Leave confirmation
- [x] FAB: Create / Join action sheet
- [x] Empty state with Volt illustration
- [x] Pull-to-refresh

### 3.2 Create Group Flow
- [x] Step 1: Group name + emoji picker
- [x] Step 2: Choose starting activities (presets + custom)
- [x] Step 3: Set group "vibe" (optional)
- [x] Step 4: Group goal description (optional)
- [x] Step 5: Invite screen (code + link + QR)
- [x] Store group in Supabase, assign ADMIN role
- [x] Invite code generation with collision retry

### 3.3 Join Group Flow
- [x] Manual code entry (segmented 6-char input)
- [x] Deep link auto-fill join
- [x] QR code scanner (Expo Camera)
- [x] Validate invite code
- [x] Check group capacity (max 6)
- [x] "Group is full" error handling
- [x] Add to group_members, trigger notification

### 3.4 Group Home Screen
- [x] Header: group info + member avatars + group streak
- [x] Feed Tab (group-filtered submission feed)
- [x] Activities Tab (activity cards with member streak grid)
- [x] Members Tab (member list with XP, level, streak, Nudge button)
- [x] Leaderboard Tab (ranked by monthly XP)
- [x] Admin settings gear icon

### 3.5 Group Settings (Admin)
- [x] Rename group, change emoji
- [x] Add/archive activities
- [x] Submission window config
- [x] Rest days config
- [x] Photo proof toggle
- [x] Group streak toggle
- [x] Remove members
- [x] Regenerate invite code
- [x] Delete group (soft delete)

### 3.6 Group Invite Sharing
- [x] Share sheet with formatted message
- [x] Copy code with haptic feedback
- [x] QR code generation (SVG)

---

## Phase 4: Activity System & Templates (1.5 weeks)

### 4.1 Activity Templates Engine
- [x] Define all 9 preset activity templates (fields, icons, colors)
- [x] Field definition schema (text, number, multiselect, singleselect, toggle, stars, emoji-scale)
- [x] Store as `constants/activityTemplates.ts`

### 4.2 Create Activity Flow
- [x] Activity selector grid (preset cards + "Create Custom")
- [x] Preset flow: select → configure frequency → rest days → photo toggle → confirm
- [x] Custom flow: name + icon + color → frequency → custom fields → photo → confirm
- [x] Store activity in Supabase `activities` table

### 4.3 Activity Card Component
- [x] Color-coded header bar
- [x] Member streak grid (avatar + streak + today status)
- [x] "Submit for today" CTA with pulsing glow

### 4.4 Activity Detail Screen
- [x] Header with icon, name, color
- [x] Calendar | Submissions History tabs
- [x] Activity info (frequency, rest days, fields)
- [x] Admin actions: Edit, Archive

### 4.5 Dynamic Form Renderer
- [x] Generic DynamicForm component from templateFields JSON
- [x] Text field renderer
- [x] Number field renderer
- [x] Multi-select chips renderer
- [x] Single select renderer
- [x] Toggle renderer
- [x] Star rating renderer
- [x] Emoji scale renderer
- [x] Required field validation + inline errors
- [x] React Hook Form integration

---

## Phase 5: Submission System & Media (2 weeks)

### 5.1 Submission Entry Points
- [x] FAB → activity selector bottom sheet → submission flow
- [x] Activity card "Submit" → direct submission flow
- [x] Today Banner dot → direct submission flow

### 5.2 Camera & Photo Step
- [x] Expo ImagePicker (camera default + gallery)
- [x] Camera overlay with activity name badge
- [x] "Skip photo" button
- [x] Crop interface (1:1 or 4:5)
- [x] Auto-compression (≤800KB)
- [x] Photo preview with retake/remove

### 5.3 Activity Fields Step
- [x] Dynamic form rendering based on activity template
- [x] Required field validation
- [x] Keyboard-avoiding scroll view

### 5.4 Title & Description Step
- [x] Title input (80 chars, optional)
- [x] Description textarea (500 chars, optional)
- [x] Character counters
- [x] Quick suggestion chips

### 5.5 Confirm & Submit Step
- [x] Preview card (photo + title + field summary)
- [x] "Submit StreakPact 🚀" button
- [x] Submit pipeline: timestamp → upload photo → create record → Firestore mirror → streak update → XP → notify
- [x] Confetti + XP animation + Volt cheers
- [x] Navigate to feed

### 5.6 Submission Edit & Delete
- [x] Edit within 1 hour (title, description, fields only)
- [x] Delete within 24 hours (streak break warning)
- [x] Sync edits/deletes to Supabase + Firestore

### 5.7 Offline Queue
- [x] AsyncStorage queue for offline submissions
- [x] Offline banner
- [x] Auto-upload on reconnect with original timestamps
- [x] Toast notification on sync
- [x] Handle photo upload failures gracefully

---

## Phase 6: Calendar & Streak Engine (2 weeks)

### 6.1 Group Calendar View
- [x] Month grid (7-column, current month)
- [x] Member dots per day cell (green/red/orange/grey/purple)
- [x] Tap day → bottom sheet with member submissions
- [x] Month navigation (swipe left/right)
- [x] "Today" snap-back button

### 6.2 Streak Summary Bar
- [x] Member streak cards (avatar, name, current/longest streak, total)
- [x] Sorted by current streak descending
- [x] Animated flame icon scaling

### 6.3 Comparative View (2-Person)
- [x] Side-by-side mini calendars
- [x] Streak battle banner
- [x] Animated versus indicator

### 6.4 Year Overview (GitHub-Style)
- [x] 365-cell heat map
- [x] Color intensity by submission count
- [x] Tap month → jump to detail view

### 6.5 Streak Calculation Engine
- [x] Supabase Edge Function / pg_cron daily job (00:05 UTC)
- [x] Streak break detection per user per activity
- [x] Milestone detection (7/14/30/60/100)
- [x] Timezone handling (user device TZ)
- [x] 2-minute grace window for edge-case submissions

### 6.6 Streak Shields
- [x] Earn 1 shield per 7 consecutive days
- [x] Max stockpile: 3
- [x] Missed day modal: "Use shield?"
- [x] Shield consumption logic
- [x] 1 shield per activity per week rule
- [x] Shield count UI on activity cards + profile

### 6.7 Rest Day System
- [x] Declare rest day (before midnight)
- [x] Rest day picker bottom sheet
- [x] Calendar grey dot with 🛌 icon
- [x] 0–2 rest days per week limit
- [x] No backdating rule

---

## Phase 7: Social Features & Feed (1.5 weeks)

### 7.1 Home Feed
- [x] Chronological aggregated feed
- [x] Feed card component (full anatomy)
- [x] Feed filters: All, By Group, By Activity
- [x] Empty state with Volt
- [x] Pull-to-refresh animation
- [x] Infinite scroll pagination (20/page)

### 7.2 Today Banner
- [x] Horizontal scroll at top
- [x] Activity icon + name + status (✅/🟠)
- [x] Tap pending → launch submission flow
- [x] Sticky with blur backdrop

### 7.3 Reactions System
- [x] 5 emoji reactions (🔥💪👏❤️💯)
- [x] Tap to react / un-react with animation
- [x] One reaction per user per submission
- [x] Reaction counts display
- [x] Tap count → who-reacted bottom sheet
- [x] Firestore real-time sync

### 7.4 Comments System
- [x] Expandable comment section
- [x] Comment input + send button
- [x] Comment display (avatar, name, text, timestamp)
- [x] @mention autocomplete
- [x] Firestore real-time listener

### 7.5 Nudge System
- [x] Nudge button visibility logic (after noon, not submitted)
- [x] Lightning bolt animation
- [x] Push notification to recipient
- [x] 4-hour cooldown per recipient
- [x] Hype Man XP bonus (submit within 2hr of nudge)
- [x] Firestore nudge storage

### 7.6 Weekly Wrap-Up Card
- [x] Auto-generate Sunday 7 PM (Supabase scheduled function)
- [x] Card content: group + activity + member stats + MVP
- [x] Shareable PNG generation
- [x] "Share to Instagram/WhatsApp" export
- [x] Card stored in Supabase Storage

---

## Phase 8: Gamification & Rewards (1.5 weeks)

### 8.1 XP Engine
- [ ] Implement XP formula (base + bonuses × streak multiplier)
- [ ] XP award Edge Function on submission create
- [ ] Reaction bonus recalculation (on 3rd reaction)
- [ ] XP chip animation

### 8.2 Leveling System
- [ ] 7 levels with XP thresholds
- [ ] Level progress bar (animated fill)
- [ ] Level-up celebration animation
- [ ] Level badge display everywhere

### 8.3 Badges & Achievements
- [ ] Streak badges (5): First Flame, Charged, Diamond Grinder, Unstoppable, Legend
- [ ] Activity badges (4): Iron Body, Scholar, Algorithm Brain, Road Runner
- [ ] Social badges (3): Hype Man, Team Captain, Coach
- [ ] Special badges (4): Early Bird, Night Owl, Shield Bearer, Comeback Kid
- [ ] Badge unlock detection (DB triggers / Edge Functions)
- [ ] Unlock notification (push + in-app toast)
- [ ] Badge display (earned = color, unearned = greyscale locked)

### 8.4 Weekly Challenges
- [ ] Auto-generate Monday challenges (Supabase scheduled function)
- [ ] Custom challenge creation by group members
- [ ] Challenge card in Group Home (progress bar, deadline)
- [ ] Challenge completion (confetti + badge)

### 8.5 Leaderboard
- [ ] Group leaderboard (monthly XP)
- [ ] Animated bar chart with avatars
- [ ] Monthly reset + "Last champion" highlight
- [ ] Rank change indicators

---

## Phase 9: Notifications & User Profile (1.5 weeks)

### 9.1 Push Notifications
- [ ] Expo Notifications + FCM integration
- [ ] All 13 notification types implemented
- [ ] Notification scheduling (pg_cron + FCM)
- [ ] Casual motivating copy tone

### 9.2 Notification Settings
- [ ] Per-type toggles
- [ ] Per-activity granularity
- [ ] Quiet hours
- [ ] Weekend mode

### 9.3 In-App Notification Center
- [ ] Bell icon with unread count
- [ ] Notification list
- [ ] Tap → deep link
- [ ] "Mark all as read"

### 9.4 User Profile Screen
- [ ] Header: avatar, name, username, level, XP bar, shields
- [ ] Stats overview (4 cards)
- [ ] Active streaks scroll
- [ ] Achievements grid
- [ ] Activity history (filterable)
- [ ] Year in review heat map
- [ ] Groups list
- [ ] Public profile (read-only)

### 9.5 Settings Screen
- [ ] Account settings
- [ ] Notification settings
- [ ] Appearance settings
- [ ] Privacy settings
- [ ] Data & Storage settings
- [ ] About section

---

## Phase 10: Polish, Testing & Launch (2 weeks)

### 10.1 Animations
- [ ] All 9 key animations from design.md
- [ ] Micro-interactions + haptics
- [ ] Skeleton shimmers
- [ ] Volt mascot (toggleable)

### 10.2 Accessibility
- [ ] 44×44pt touch targets
- [ ] Icon + color status indicators
- [ ] Reduced motion mode
- [ ] Font scaling 140% test
- [ ] Screen reader labels
- [ ] WCAG AA contrast
- [ ] VoiceOver + TalkBack testing

### 10.3 Performance
- [ ] Image lazy loading
- [ ] FlatList virtualization
- [ ] Bundle size optimization
- [ ] Hermes optimization
- [ ] Memory profiling
- [ ] Cache strategy tuning

### 10.4 Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests (Detox)
- [ ] Backend tests
- [ ] Manual QA (device matrix)
- [ ] Accessibility testing
- [ ] Offline testing

### 10.5 App Store Prep
- [ ] App icons
- [ ] Marketing screenshots
- [ ] Store descriptions
- [ ] Privacy policy + ToS
- [ ] EAS Build production profiles
- [ ] TestFlight / Internal testing

### 10.6 Launch Checklist
- [ ] Security audit (RLS + Firestore rules)
- [ ] Rate limiting
- [ ] Error tracking (Sentry)
- [ ] Analytics (PostHog)
- [ ] Monitoring dashboard
- [ ] Backup strategy
- [ ] Incident response playbook

---

## Progress Summary

| Phase | Tasks | Done | Status |
|---|---|---|---|
| 1. Foundation | 32 | 30 | [/] In Progress |
| 2. Auth & Onboarding | 24 | 20 | [/] In Progress |
| 3. Groups & Teams | 38 | 38 | [x] Completed |
| 4. Activity System | 20 | 20 | [x] Completed |
| 5. Submissions | 24 | 24 | [x] Completed |
| 6. Calendar & Streaks | 24 | 24 | [x] Completed |
| 7. Social & Feed | 24 | 24 | [x] Completed |
| 8. Gamification | 17 | 0 | ⬜ Not Started |
| 9. Notifications & Profile | 26 | 0 | ⬜ Not Started |
| 10. Polish & Launch | 30 | 0 | ⬜ Not Started |
| **Total** | **243** | **180** | **74%** |
