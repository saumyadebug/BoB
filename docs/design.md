# StreakPact — Design System Document

**Theme Codename:** "Cyber-Minimalist Dark OS" (Pulsar OS / Volta Studio aesthetic)  
**Version:** 2.0  
**Last Updated:** August 2026

---

## 1. Design Philosophy & Aesthetic

StreakPact's visual identity embraces a **deep-space, cyber-minimalist OS** aesthetic.
It takes inspiration from aerospace telemetry HUDs, futuristic control centers (Pulsar OS / Volta Studio), and high-precision productivity tools.

### Core Principles
1. **OLED Pitch Black Canvas (`#050608` / `#000000`):** Creates stark, immersive contrast.
2. **Layered Smoked Glass Panels (`#101216`, `#16181F`):** Depth is communicated through layered dark opacity and crisp `1px` hairline borders (`rgba(255, 255, 255, 0.08)`), rather than heavy drop shadows.
3. **High-Voltage Signal Accents:**
   - **Electric Red (`#FF334B`):** Dedicated to `LIVE!`, `NOW!`, active day indicators (`TUE`), record states, and urgent alerts.
   - **Cosmic Ice Blue (`#3A82F7`):** Primary interactive elements, selected states, and progress indicators.
4. **Dual Typographic Precision:** Clean modern sans (`Inter`) for UI copy and headlines, paired with technical monospace (`JetBrains Mono`) for all metrics, timers (`02:14`), phase markers (`Phase 2 of 3`), percentages (`51%`), and coordinates.
5. **Tactile Hardware Components:**
   - **Capsule Pills:** Translucent dark pill buttons (`rounded-full`) with fine borders (`Work ⊕`, `Talks ⊝`).
   - **Tactile Squircle Matrix:** Uniform grid tiles (`rounded-2xl`) with status indicator pips (red/blue).
   - **Floating HUD Modules:** Bottom/top telemetry panels with real-time timers and playback/scrubber controls.
   - **Bracketed Action Buttons:** Technical monospace action triggers (`[ UPLOAD NOW ]`, `[ SCHEDULE CALL ]`).

---

## 2. Color Palette Tokens

| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `bgBase` | `#050608` | OLED pitch black canvas background |
| `bgPanel` | `#101216` | Smoked glass container panels & cards |
| `bgSurface` | `#16181F` | Squircle grid tiles, inner inputs, elevated cards |
| `bgGlass` | `rgba(18, 20, 26, 0.85)` | Translucent floating HUD modules |
| `bgPill` | `rgba(255, 255, 255, 0.07)` | Capsule pill button background |
| `accentRed` | `#FF334B` | Signal Electric Red: `LIVE!` tags, active `TUE`, timers |
| `accentBlue` | `#3A82F7` | Cosmic Ice Blue: Interactive links, selected states |
| `textPrimary` | `#FFFFFF` | Headlines, primary text, large display numbers |
| `textSecondary` | `#8E95A2` | Subtitles, labels, metadata |
| `textTertiary` | `#525866` | Disabled states, bracket borders, subtle hints |
| `hairline` | `rgba(255, 255, 255, 0.08)` | 1px panel border |
| `hairlineStrong` | `rgba(255, 255, 255, 0.16)` | 1px active/focused border |

---

## 3. Typography Hierarchy

| Role | Font Family | Size / Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | `SpaceGrotesk-Bold` / `Inter-Bold` | 48–64px / 52–68px | `-0.03em` | Massive hero numbers (`2`, `3`), title (`Build`) |
| **Headline** | `Inter-SemiBold` | 20–24px / 26–28px | `-0.01em` | Card titles, screen headlines |
| **Body** | `Inter-Regular` | 14px / 20px | `0` | Content text, descriptions |
| **Label / Meta** | `Inter-Medium` | 11–12px / 16px | `0.02em` | Tags, subtitles, day headers |
| **Mono Data** | `JetBrainsMono-Bold` | 18–32px | `-0.02em` | Timers (`02:14`), stats (`51%`), phases (`Phase 2 of 3`) |
| **Mono Sm** | `JetBrainsMono-Medium` | 11–13px | `0.05em` | Bracketed actions (`[ SCHEDULE CALL ]`) |

---

## 4. Reusable UI Components

### 4.1 Button (`<Button />`)
- `primary`: Solid Cosmic Ice Blue (`#3A82F7`)
- `pill`: Translucent dark capsule (`rgba(255,255,255,0.07)`) with 1px border
- `signal`: Solid Electric Red capsule (`#FF334B`)
- `bracketed`: Technical monospace action `[ ACTION LABEL ]`
- `ghost`: Transparent with subtle hover tint

### 4.2 Card (`<Card />`)
- `glass`: Translucent smoked graphite panel (`rgba(18, 20, 26, 0.85)`)
- `squircle`: Rounded tile (`rounded-2xl`) for grid items
- `elevated`: Smoked `#101216` with hairline border
- `flat`: Solid flat `#101216`

### 4.3 Matrix Grid (`<MatrixGrid />`)
- Day pill headers (`MON`, `TUE` active in red, `WED`, `THU`, `FRI`)
- Tactile squircle tiles with status dots (red/blue pips) and circular metric dials (`51%`)

### 4.4 HUD Panel (`<HudPanel />`)
- Status readout + real-time monospace countdown timer
- Scrubber and playback controls (`⏮ ⏸ ⏭`)
- Action ring trigger with circular accent halo
- Large dual split numerals (`2` / `3`)

### 4.5 Badge (`<Badge />`)
- `live`: Electric Red badge with pulse dot (`LIVE!`, `NOW!`)
- `pill`: Semi-translucent dark pill badge
- `primary`, `positive`, `warning`, `danger`, `outline`
