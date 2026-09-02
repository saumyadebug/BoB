import { IconName } from '@/components/ui/Icon';

/**
 * Group emoji ↔ icon name conversion.
 *
 * The `groups.emoji` column stores a Phosphor icon name (e.g. "barbell", "book",
 * "lightning", "sparkle") so the group card and group home can render it as
 * a proper line icon, not a colored emoji blob. This helper resolves a raw
 * emoji field to a valid IconName, with a fallback to "flash" if the value
 * is a legacy unicode emoji or an unknown string.
 */

const VALID: ReadonlyArray<IconName> = [
  'lightning', 'flash', 'fire', 'flame', 'crown', 'trophy', 'star',
  'heart', 'book', 'bookmark', 'pencil', 'code',
  'barbell', 'dumbbell', 'rocket', 'medal',
  'leaf', 'music-notes', 'paint-brush', 'sun', 'moon',
  'users', 'user', 'compass', 'map-pin', 'shield',
  'sparkle', 'house', 'bell', 'spark',
];

export function resolveGroupIcon(emoji: string | null | undefined): IconName {
  if (!emoji) return 'flash';
  // If it happens to be a legacy unicode emoji, pick a sensible default
  // based on the emoji character.
  if (emoji.codePointAt(0)! > 0x2700 && VALID.indexOf(emoji as IconName) === -1) {
    // Common unicode emoji fallbacks
    if (emoji.includes('🏋') || emoji.includes('💪')) return 'barbell';
    if (emoji.includes('📚') || emoji.includes('📖')) return 'book';
    if (emoji.includes('⚡') || emoji.includes('🔥')) return 'lightning';
    if (emoji.includes('🌅') || emoji.includes('☀')) return 'sun';
    if (emoji.includes('🌙') || emoji.includes('✨')) return 'sparkle';
    if (emoji.includes('🎯')) return 'target';
    if (emoji.includes('💻')) return 'code';
    if (emoji.includes('🏃')) return 'rocket';
    if (emoji.includes('🧘')) return 'leaf';
    if (emoji.includes('💧') || emoji.includes('🌊')) return 'drop';
    return 'flash';
  }
  return (VALID.indexOf(emoji as IconName) >= 0 ? emoji : 'flash') as IconName;
}

/**
 * Vibe → icon name + color pair (used by GroupsScreen card).
 */
export function vibeVisuals(vibe: string | null | undefined): { icon: IconName; color: string } {
  switch (vibe) {
    case 'study': return { icon: 'book', color: '#2E9D6A' };
    case 'gym':   return { icon: 'barbell', color: '#8B5CF6' };
    case 'hustle':return { icon: 'lightning', color: '#FF5B1F' };
    case 'relaxed': return { icon: 'leaf', color: '#22C55E' };
    case 'custom': return { icon: 'sparkle', color: '#7C3AED' };
    default:      return { icon: 'flash', color: '#FF5B1F' };
  }
}
