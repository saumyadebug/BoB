// supabase/functions/seed-dev/index.ts
// Idempotent dev seed. Creates test users, a populated group, activities,
// and a few submissions. Idempotent — safe to re-run.
//
// Run via: `supabase functions invoke seed-dev --no-verify-jwt`
// Or hit the deployed URL: <project>.supabase.co/functions/v1/seed-dev
//
// Default test accounts (all password: `streakdev123`):
//   alex@streakpact.app   (admin of "Morning Hustle")
//   sarah@streakpact.app  (member of "Morning Hustle")
//   mike@streakpact.app   (member of "Bookworms")

import { handleCors } from '../_shared/cors.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const TEST_USERS = [
  { email: 'alex@streakpact.app',  username: 'alex',  display_name: 'Alex Rivera',  avatar_url: 'https://i.pravatar.cc/200?u=alex' },
  { email: 'sarah@streakpact.app', username: 'sarah', display_name: 'Sarah Kim',    avatar_url: 'https://i.pravatar.cc/200?u=sarah' },
  { email: 'mike@streakpact.app',  username: 'mike',  display_name: 'Mike Chen',    avatar_url: 'https://i.pravatar.cc/200?u=mike' },
];

const DEFAULT_PASSWORD = 'streakdev123';
const GROUP_NAME = 'Morning Hustle';
const INVITE_CODE = 'HUSTLE7';

/**
 * Insert a submission only if no submission exists for the same
 * (user_id, activity_id, date) tuple. We can't use onConflict here because
 * the unique index uses a DATE() expression.
 */
async function insertSubmissionIfMissing(
  supabase: ReturnType<typeof getServiceClient>,
  payload: Record<string, any>
): Promise<{ inserted: boolean; id?: string }> {
  const dateStr = (payload.client_timestamp as string).slice(0, 10); // YYYY-MM-DD
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', payload.user_id)
    .eq('activity_id', payload.activity_id)
    .gte('client_timestamp', `${dateStr}T00:00:00Z`)
    .lt('client_timestamp', `${dateStr}T23:59:59Z`)
    .maybeSingle();

  if (existing) return { inserted: false, id: existing.id };

  const { data, error } = await supabase.from('submissions').insert(payload).select('id').single();
  if (error) throw error;
  return { inserted: true, id: data.id };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = getServiceClient();

  try {
    // 1. Upsert auth.users + public.users
    const userIds: Record<string, string> = {};
    for (const u of TEST_USERS) {
      const { data: existingList } = await supabase.auth.admin.listUsers();
      const found = existingList?.users.find((au: any) => au.email === u.email);

      let authId: string;
      if (found) {
        authId = found.id;
      } else {
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email: u.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: { display_name: u.display_name },
        });
        if (createErr) throw createErr;
        authId = created.user!.id;
      }
      userIds[u.email] = authId;

      // b) Ensure public.users row (upsert on id)
      const { error: upsertErr } = await supabase.from('users').upsert({
        id: authId,
        email: u.email,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        xp: 4250,
        level: 4,
        total_submissions: 48,
        longest_streak: 18,
        shields_available: 2,
      }, { onConflict: 'id' });
      if (upsertErr) throw upsertErr;
    }

    // 2. Create the "Morning Hustle" group (Alex admin, Sarah member)
    const { data: existingGroups } = await supabase
      .from('groups')
      .select('id, name')
      .eq('name', GROUP_NAME);
    let groupId: string;
    if (existingGroups && existingGroups.length > 0) {
      groupId = existingGroups[0].id;
    } else {
      const { data: g, error: gErr } = await supabase.from('groups').insert({
        name: GROUP_NAME,
        emoji: '⚡',
        vibe: 'hustle',
        goal_description: 'Crush it before the sun goes down.',
        admin_id: userIds['alex@streakpact.app'],
        member_count: 2,
        invite_code: INVITE_CODE,
      }).select().single();
      if (gErr) throw gErr;
      groupId = g!.id;

      // Add members
      const { error: memErr } = await supabase.from('group_members').insert([
        { group_id: groupId, user_id: userIds['alex@streakpact.app'],  role: 'admin' },
        { group_id: groupId, user_id: userIds['sarah@streakpact.app'], role: 'member' },
      ]);
      if (memErr) throw memErr;

      // Add activities
      const { error: actErr } = await supabase.from('activities').insert([
        {
          group_id: groupId,
          name: 'Gym / Workout',
          icon: 'barbell',
          color: '#8B5CF6',
          frequency: 'daily',
          frequency_days: [0, 1, 2, 3, 4, 5, 6],
          require_photo: true,
          template_key: 'gym',
          created_by: userIds['alex@streakpact.app'],
          template_fields: [
            { id: 'muscleGroups', label: 'Muscle groups trained', type: 'multiselect',
              options: ['Chest', 'Back', 'Arms', 'Shoulders', 'Core', 'Legs'], required: true },
            { id: 'duration', label: 'Session duration', type: 'number', unit: 'min', required: true },
          ],
        },
        {
          group_id: groupId,
          name: 'Read',
          icon: 'book',
          color: '#2E9D6A',
          frequency: 'daily',
          frequency_days: [0, 1, 2, 3, 4, 5, 6],
          require_photo: false,
          template_key: 'read',
          created_by: userIds['alex@streakpact.app'],
          template_fields: [
            { id: 'book', label: 'Book', type: 'text', required: true },
            { id: 'duration', label: 'Minutes', type: 'number', unit: 'min', required: true },
          ],
        },
      ]);
      if (actErr) throw actErr;
    }

    // 3. Fetch activities (so we have their real ids)
    const { data: activities } = await supabase
      .from('activities')
      .select('id, name')
      .eq('group_id', groupId);
    const gymAct = activities?.find((a: any) => a.name === 'Gym / Workout');
    const readAct = activities?.find((a: any) => a.name === 'Read');

    let submittedCount = 0;
    let skippedCount = 0;

    // 4. Add 5 days of gym + 3 days of read submissions for Alex
    const alexId = userIds['alex@streakpact.app'];
    if (gymAct) {
      for (let daysAgo = 0; daysAgo < 5; daysAgo++) {
        const ts = new Date(Date.now() - daysAgo * 86400_000).toISOString();
        const res = await insertSubmissionIfMissing(supabase, {
          user_id: alexId,
          activity_id: gymAct.id,
          group_id: groupId,
          title: daysAgo === 0 ? 'Leg day, crushed' : `Day ${daysAgo + 1} session`,
          description: 'Solid session, pushed hard.',
          field_values: { muscleGroups: ['Legs', 'Core'], duration: 60 },
          xp_earned: 75,
          client_timestamp: ts,
        });
        if (res.inserted) submittedCount++; else skippedCount++;
      }
    }
    if (readAct) {
      for (let daysAgo = 0; daysAgo < 3; daysAgo++) {
        const ts = new Date(Date.now() - daysAgo * 86400_000).toISOString();
        const res = await insertSubmissionIfMissing(supabase, {
          user_id: alexId,
          activity_id: readAct.id,
          group_id: groupId,
          title: 'Atomic Habits, ch. 4',
          description: 'Great insights on habit stacking.',
          field_values: { book: 'Atomic Habits', duration: 30 },
          xp_earned: 50,
          client_timestamp: ts,
        });
        if (res.inserted) submittedCount++; else skippedCount++;
      }
    }

    // 5. Refresh group member_count
    const { data: actualCount } = await supabase
      .from('group_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('group_id', groupId);
    await supabase
      .from('groups')
      .update({ member_count: actualCount ?? 2 })
      .eq('id', groupId);

    return jsonResponse({
      ok: true,
      message: 'Dev seed applied.',
      users: Object.fromEntries(
        Object.entries(userIds).map(([email, id]) => [email, id])
      ),
      groupId,
      submissionsInserted: submittedCount,
      submissionsSkipped: skippedCount,
      defaultPassword: DEFAULT_PASSWORD,
      hint: 'Sign in with alex@streakpact.app / streakdev123',
    });
  } catch (err) {
    console.error('seed-dev error:', err);
    return errorResponse((err as Error).message, 500);
  }
});
