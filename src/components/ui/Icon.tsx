import React from 'react';
import { PhosphorIcon } from './PhosphorIcon';

/**
 * StreakPact icon set.
 *
 * Uses Phosphor (line weight: regular by default, bold when `bold` is true).
 * Phosphor's geometric, slightly-quirky personality fits the brand better than
 * the AI-default Lucide. Weight and rendering is locked via this wrapper —
 * never import phosphor directly in screens.
 *
 * Usage: <Icon name="lightning" size={20} color={COLORS.ink} bold />
 */

export type IconName =
  | 'lightning' | 'flash' | 'fire' | 'flame' | 'spark'
  | 'house' | 'house-fill' | 'users' | 'users-fill'
  | 'trophy' | 'trophy-fill'
  | 'user' | 'user-fill'
  | 'plus' | 'check' | 'x' | 'arrow-right' | 'arrow-left' | 'arrow-up-right'
  | 'caret-down' | 'caret-right' | 'caret-up' | 'caret-left'
  | 'camera' | 'image' | 'paper-plane-right'
  | 'gear' | 'gear-fill' | 'sliders' | 'sliders-horizontal'
  | 'bell' | 'bell-fill' | 'bell-ringing'
  | 'magnifying-glass' | 'funnel'
  | 'heart' | 'heart-fill' | 'chat-circle' | 'chat-circle-fill'
  | 'share-network' | 'link' | 'qr-code' | 'copy' | 'key'
  | 'clock' | 'play' | 'pause' | 'shuffle' | 'arrows-clockwise' | 'speaker-high'
  | 'globe' | 'envelope' | 'notebook'
  | 'lock' | 'lock-open' | 'fingerprint' | 'shield' | 'shield-fill' | 'shield-check'
  | 'star' | 'star-fill' | 'medal' | 'medal-fill'
  | 'eye' | 'eye-slash'
  | 'calendar' | 'calendar-blank' | 'calendar-check'
  | 'pencil' | 'pencil-simple' | 'trash' | 'trash-simple'
  | 'sparkle' | 'sparkle-fill'
  | 'lightning-slash'
  | 'sun' | 'moon' | 'moon-stars'
  | 'crown' | 'crown-simple'
  | 'flag' | 'flag-fill'
  | 'chart-line-up' | 'chart-bar'
  | 'map-pin' | 'compass'
  | 'sign-out' | 'gear-six'
  | 'plus-circle' | 'minus-circle'
  | 'check-circle' | 'check-circle-fill'
  | 'warning' | 'warning-circle' | 'info'
  | 'lightbulb'
  | 'target'
  | 'book' | 'book-fill'
  | 'barbell' | 'barbell-fill'
  | 'dumbbell'
  | 'yoga'
  | 'leaf'
  | 'music-notes'
  | 'paint-brush'
  | 'pen-nib'
  | 'pen'
  | 'paw-print'
  | 'drop'
  | 'snowflake'
  | 'sun-horizon'
  | 'moon-stars-fill'
  | 'hand-waving'
  | 'hourglass' | 'hourglass-medium'
  | 'dot' | 'dots-three' | 'dots-three-vertical'
  | 'paper-plane-tilt'
  | 'rocket' | 'rocket-fill'
  | 'code'
  | 'smiley' | 'smiley-meh' | 'smiley-sad' | 'smiley-wink' | 'smiley-angry'
  | 'lightning-a'
  | 'volleyball'
  | 'arrow-up' | 'arrow-down' | 'arrow-left-fill' | 'arrow-right-fill'
  | 'user-plus' | 'user-minus' | 'user-check' | 'user-circle'
  | 'sign-in' | 'bookmark' | 'bookmark-simple'
  | 'house-simple' | 'bookmark-fill' | 'house-line';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  bold?: boolean;
  fillColor?: string; // for fill-style icons (e.g. house-fill)
}

export function Icon({ name, size = 20, color, bold = false, fillColor }: IconProps) {
  return <PhosphorIcon name={name} size={size} color={color} bold={bold} fillColor={fillColor} />;
}

export default Icon;
