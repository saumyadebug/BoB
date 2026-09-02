/**
 * Level progression — 7 levels with XP thresholds.
 *
 * Level 1: 0–999 XP
 * Level 2: 1,000–2,499
 * Level 3: 2,500–4,999
 * Level 4: 5,000–9,999
 * Level 5: 10,000–19,999
 * Level 6: 20,000–39,999
 * Level 7: 40,000+
 *
 * (Matches the PRD's XP formula: base + bonuses × streak multiplier.)
 */

const LEVEL_THRESHOLDS = [0, 1000, 2500, 5000, 10000, 20000, 40000];
const LEVEL_NAMES = ['Newbie', 'Hustler', 'Grinder', 'Crusher', 'Legend', 'Champion', 'Immortal'];

export function levelFromXp(xp: number): { level: number; name: string; currentLevelXp: number; nextLevelXp: number | null } {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  level = Math.min(level, LEVEL_THRESHOLDS.length);
  const idx = Math.max(0, level - 1);
  const currentLevelXp = LEVEL_THRESHOLDS[idx];
  const nextLevelXp = idx + 1 < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[idx + 1] : null;
  return {
    level,
    name: LEVEL_NAMES[idx] ?? 'Newbie',
    currentLevelXp,
    nextLevelXp,
  };
}

export function xpProgressInLevel(xp: number): { current: number; total: number; percent: number } {
  const { currentLevelXp, nextLevelXp } = levelFromXp(xp);
  if (nextLevelXp === null) {
    return { current: xp - currentLevelXp, total: 0, percent: 100 };
  }
  const total = nextLevelXp - currentLevelXp;
  const current = xp - currentLevelXp;
  return {
    current: Math.max(0, current),
    total,
    percent: Math.min(100, Math.max(0, (current / total) * 100)),
  };
}
