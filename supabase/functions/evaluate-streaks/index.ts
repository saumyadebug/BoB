// supabase/functions/evaluate-streaks/index.ts
// Scheduled daily maintenance function to evaluate streaks, consume shields,
// and reset broken streaks for active pact members.

import { createAdminClient } from '../_shared/supabase-client.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createAdminClient();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    // Fetch all active streaks (current_streak > 0)
    const { data: streaks, error: streaksError } = await supabase
      .from('streaks')
      .select('id, user_id, activity_id, current_streak, last_submission_date, shield_used_dates, rest_day_dates')
      .gt('current_streak', 0);

    if (streaksError) {
      return errorResponse('Failed to fetch streaks', 500, streaksError);
    }

    let evaluated = 0;
    let shieldsApplied = 0;
    let streaksReset = 0;

    for (const streak of (streaks ?? [])) {
      evaluated++;

      // If last submission was yesterday or today, streak is healthy
      if (
        streak.last_submission_date === yesterday ||
        (streak.last_submission_date && streak.last_submission_date > yesterday)
      ) {
        continue;
      }

      // If yesterday was declared as a rest day, streak is protected
      if (streak.rest_day_dates?.includes(yesterday)) {
        continue;
      }

      // Day was missed! Check shield eligibility
      const { data: user } = await supabase
        .from('users')
        .select('shields_available')
        .eq('id', streak.user_id)
        .single();

      const shieldsAvailable = user?.shields_available ?? 0;
      const recentShieldUsed = (streak.shield_used_dates ?? []).some(
        (d: string) => d >= sevenDaysAgo
      );

      if (shieldsAvailable > 0 && !recentShieldUsed) {
        // Apply streak shield
        await supabase
          .from('users')
          .update({ shields_available: shieldsAvailable - 1 })
          .eq('id', streak.user_id);

        const updatedShieldDates = [...(streak.shield_used_dates ?? []), yesterday].sort();
        await supabase
          .from('streaks')
          .update({
            shield_used_dates: updatedShieldDates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', streak.id);

        shieldsApplied++;
      } else {
        // Streak is broken
        await supabase
          .from('streaks')
          .update({
            current_streak: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', streak.id);

        streaksReset++;
      }
    }

    return jsonResponse({
      ok: true,
      evaluatedDate: yesterday,
      totalEvaluated: evaluated,
      shieldsApplied,
      streaksReset,
    });
  } catch (err: any) {
    return errorResponse(err.message ?? 'Internal Server Error', 500);
  }
});
