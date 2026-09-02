/**
 * StreakPact Design System — Dark Cosmos
 *
 * Reference aesthetic: deep-space, near-black interface with layered glass
 * panels, muted blue-grey accents, and precise typographic hierarchy. The
 * tone is elite, focused, and ambient — like a control room.
 *
 * Spec source: Required/design.md
 *
 * Core rules:
 *  - Depth is conveyed through layered opacity + 1px border + (sparingly)
 *    backdrop-filter blur — never box-shadow as a primary depth signal.
 *  - Two accent colors only: --accent-blue (interactive) and --accent-red
 *    (live/alert only — never decorative).
 *  - Sentence case everywhere. No ALL CAPS as a style choice.
 *  - Left-aligned by default. Center only for full-bleed hero moments.
 *  - Monospace for data/IDs/timers/numerics. Inter for everything else.
 */

// ─── Color Palette ────────────────────────────────────────────────────────────

const _palette = {
  // Background
  bgBase:    '#050608',   // OLED pitch black canvas
  bgPanel:   '#101216',   // smoked glass panels, cards
  bgSurface: '#16181F',   // inner containers, input fields, squircle cells
  bgOverlay: 'rgba(255,255,255,0.05)', // subtle glass tint
  bgGlass:   'rgba(18, 20, 26, 0.85)', // translucent floating HUDs
  bgPill:    'rgba(255,255,255,0.07)', // capsule button background

  // Border
  border:        'rgba(255,255,255,0.08)',
  borderStrong:  'rgba(255,255,255,0.16)',
  borderPill:    'rgba(255,255,255,0.12)',

  // Accent
  accentBlue:     '#3A82F7',  // primary interactive, links, selected
  accentBlueGlow: 'rgba(58, 130, 247, 0.25)',
  accentRed:      '#FF334B',  // electric signal red: live badges, active TUE, timers
  accentRedGlow:  'rgba(255, 51, 75, 0.30)',
  accentMuted:    '#232834',  // secondary highlight, hover bg

  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: '#8E95A2',
  textTertiary:  '#525866',
  textMuted:     '#3D424D',

  // Tag / pill
  tagBg:     'rgba(255,255,255,0.06)',
  tagBorder: 'rgba(255,255,255,0.10)',

  // Semantic helpers
  success:        '#2E9D6A',
  positive:       '#2E9D6A',   // legacy alias
  warning:        '#F59E0B',
  danger:         '#FF334B',
  hairline:       'rgba(255,255,255,0.08)',
  hairlineStrong: 'rgba(255,255,255,0.16)',
};

/**
 * `COLORS` is the canonical color token set for the dark cosmos theme.
 *
 * It also exposes the legacy names from the previous "tactile hardware"
 * theme as aliases, so existing screens that reference `inkDisplay`,
 * `surfaceBase`, `accent`, `accentTint`, etc. keep compiling during the
 * migration. **New code should use the new names** (bgBase, accentBlue,
 * textPrimary, etc.) — the legacy names will be removed in Phase 5.
 */
export const COLORS = {
  ..._palette,
  // Legacy aliases (to be removed once every screen is migrated)
  surfaceBase: _palette.bgBase,
  surfaceElevated: _palette.bgPanel,
  surfaceSunken: _palette.bgSurface,
  surfaceOverlay: _palette.bgOverlay,
  inkDisplay: _palette.textPrimary,
  inkPrimary: _palette.textPrimary,
  inkSecondary: _palette.textSecondary,
  inkTertiary: _palette.textTertiary,
  inkInverse: _palette.bgBase,
  accent: _palette.accentBlue,
  accentTint: _palette.bgOverlay,
  positiveTint: 'rgba(46, 157, 106, 0.12)',   // legacy semantic tint
  dangerTint: 'rgba(255, 59, 48, 0.12)',
  warningTint: 'rgba(245, 158, 11, 0.12)',
  accentTintStrong: _palette.accentMuted,
  accentHover: _palette.accentBlue,
  brandPrimary: _palette.accentBlue,   // legacy alias
  surfaceDark: _palette.bgBase,          // legacy alias
  textDisplay: _palette.textPrimary,      // legacy alias
  accentPrimaryDark: _palette.accentMuted,
  successStrong: _palette.success,
  shadowDark: 'rgba(0,0,0,0.4)',
  shadowLight: 'rgba(0,0,0,0.2)',
  // Kept for cards that read this in their own padding
  padding: 20,
};

// ─── Radius (4 sizes, no extras) ───────────────────────────────────────────

export const RADIUS = {
  xs:       4,
  sm:       6,
  md:       12,
  lg:       18,
  squircle: 16,
  xl:       24,
  xxl:      32,
  full:     999,
  pill:     999,
  radiusButton: 8,
  radiusCard: 20,
  radiusScreen: 24,
  radiusPill: 999,
};

// ─── Spacing (8px grid, tighter than the previous system) ────────────────

export const SPACE = {
  xs:   4,
  sm:   8,
  md:   14,
  lg:   20,
  xl:   28,
  xxl:  40,
  xxs:  2,
  sm2:  8,
  md2:  14,
  lg2:  20,
  base: 4,
};

// ─── Typography (Inter for UI, JetBrains Mono for numerics) ──────────────

export const TYPOGRAPHY = {
  // Display — hero stats, big session timer (mono, bold)
  displayLg: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -1.5,
    color: COLORS.textPrimary,
  },
  displayMd: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
  },
  displaySm: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: COLORS.textPrimary,
  },

  // Headline — card title, screen title
  headline: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: COLORS.textPrimary,
  },
  headlineSm: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: COLORS.textPrimary,
  },

  // Subheading — section labels
  subheading: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },

  // Body — descriptions, content text (13–14px per spec)
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  bodySm: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  // Label / Meta — tags, status chips, timestamps (11–12px)
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    color: COLORS.textSecondary,
  },
  caption: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
    color: COLORS.textTertiary,
  },

  // Mono Data — counters, IDs, timer values
  monoLg: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
  },
  monoMd: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 18,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  monoSm: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.2,
    color: COLORS.textSecondary,
  },

  // Legacy variants — kept so the existing Text component still works.
  // New code should prefer headline/body/label/mono above.
  headingLg: { fontFamily: 'Inter-SemiBold', fontSize: 22, lineHeight: 28, letterSpacing: -0.3, color: COLORS.textPrimary },
  headingMd: { fontFamily: 'Inter-SemiBold', fontSize: 18, lineHeight: 24, letterSpacing: -0.2, color: COLORS.textPrimary },
  headingSm: { fontFamily: 'Inter-Medium', fontSize: 15, lineHeight: 20, letterSpacing: -0.1, color: COLORS.textPrimary },
  bodyMedium: { fontFamily: 'Inter-Medium', fontSize: 14, lineHeight: 20, color: COLORS.textPrimary },
  eyebrow: { fontFamily: 'Inter-SemiBold', fontSize: 11, lineHeight: 14, letterSpacing: 1.4, textTransform: 'uppercase' as const, color: COLORS.textSecondary },
  numericXl: { fontFamily: 'JetBrainsMono-Bold', fontSize: 56, lineHeight: 60, letterSpacing: -2, color: COLORS.textPrimary },
  numericLg: { fontFamily: 'JetBrainsMono-Bold', fontSize: 32, lineHeight: 36, letterSpacing: -0.5, color: COLORS.textPrimary },
  numericMd: { fontFamily: 'JetBrainsMono-Bold', fontSize: 18, lineHeight: 22, color: COLORS.textPrimary },
  numericSm: { fontFamily: 'JetBrainsMono-Medium', fontSize: 13, lineHeight: 16, letterSpacing: 0.2, color: COLORS.textSecondary },
  digitalDisplay: { fontFamily: 'JetBrainsMono-Bold', fontSize: 22, lineHeight: 26, letterSpacing: 2, color: COLORS.accentRed },
};

// ─── Elevation (NO box-shadow — only tints + borders) ────────────────────

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Kept for compatibility with code that still passes shadow* style props,
  // but they're all no-ops visually — depth is conveyed by borders/tints.
  card: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardHover: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  raised: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  raisedLg: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cta: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  fabDefault: {
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 8,
  },
  fabPressed: {
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  divider: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Legacy aliases
  softElevation: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  mediumElevation: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  highElevation: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// ─── Motion (150ms / 220ms — short, no looping) ──────────────────────────

export const EASE = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  spring: { damping: 22, stiffness: 280, mass: 0.7, useNativeDriver: true },
  springBouncy: { damping: 14, stiffness: 200, mass: 0.6, useNativeDriver: true },
  springSoft: { damping: 24, stiffness: 180, mass: 0.9, useNativeDriver: true },
};

export const DURATION = {
  fast:   150,  // color/border state changes
  base:   220,  // entrance animations
  slow:   320,
  sheet:  280,
};

// ─── Layout (screen size + tap targets) ────────────────────────────────────

export const SIZES = {
  screenWidth: typeof window !== 'undefined' ? window.innerWidth : 390,
  screenHeight: typeof window !== 'undefined' ? window.innerHeight : 844,
  tapTarget: 44,
  // Legacy aliases (older code references these)
  base: 4,
  padding: 24,
  radiusCard: 18,
  radiusButton: 6,
  radiusScreen: 18,
  radiusPill: 999,
};

export default {
  COLORS,
  RADIUS,
  SPACE,
  TYPOGRAPHY,
  SHADOWS,
  EASE,
  DURATION,
  SIZES,
};
