import React from 'react';
import { View } from 'react-native';
import {
  ArrowRight, ArrowLeft, ArrowUpRight,
  Barbell, Bell, BellRinging, Book,
  Calendar, CalendarBlank, CalendarCheck,
  Camera, CaretDown, CaretRight, CaretUp, CaretLeft, ChartBar, ChartLineUp,
  Check, CheckCircle, ChatCircle, Clock, Code, Compass, Copy, Crown, CrownSimple,
  Drop,
  Envelope,
  Eye, EyeSlash,
  Fire, FireSimple, Flag, Funnel,
  Gear, GearSix, Globe,
  HandWaving, Heart, House, HouseSimple,
  Hourglass, HourglassMedium,
  Image, Info,
  Leaf, Lightning, LightningSlash, Link, Lock, LockOpen,
  MagnifyingGlass, MapPin, Medal, MinusCircle, Moon, MoonStars, MusicNotes,
  Notebook,
  PaintBrush, PaperPlaneRight, PaperPlaneTilt, Pause, PawPrint, PenNib,
  PencilSimple, PersonArmsSpread, Play,
  Plus, PlusCircle,
  QrCode,
  Rocket,
  Shield, ShieldCheck, ShareNetwork, Shuffle, SignOut, SlidersHorizontal, Snowflake, Sparkle, SpeakerHigh, Star, Sun, SunHorizon,
  ArrowsClockwise,
  Target, Trash, TrashSimple, Trophy,
  User, UserCircle, UserPlus, UsersFour, UsersThree,
  Warning, WarningCircle,
  Lightbulb,
  DotsThree, DotsThreeVertical,
} from 'phosphor-react-native';
import { COLORS } from '@/constants/theme';
import { IconName } from './Icon';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  bold?: boolean;
  fillColor?: string;
}

/**
 * Single import-and-route table for the entire icon set.
 * Adding a new icon = add the import above + one case below.
 * Keeps the rest of the app decoupled from phosphor.
 */
export function PhosphorIcon({ name, size = 20, color, bold = false, fillColor }: Props) {
  const c = color ?? COLORS.textPrimary;
  const wantFill = bold || name.endsWith('-fill') || !!fillColor;
  const baseName = (name.endsWith('-fill') ? name.replace(/-fill$/, '') : name) as IconName;
  const weight: any = wantFill ? 'fill' : 'regular';

  switch (baseName) {
    case 'lightning':      return <Lightning size={size} color={c} weight={weight} />;
    case 'fire':           return <Fire size={size} color={c} weight={weight} />;
    case 'flame':          return <FireSimple size={size} color={c} weight={weight} />;
    case 'house':          return <House size={size} color={c} weight={weight} />;
    case 'users':          return <UsersFour size={size} color={c} weight={weight} />;
    case 'trophy':         return <Trophy size={size} color={c} weight={weight} />;
    case 'user':           return <User size={size} color={c} weight={weight} />;
    case 'user-plus':      return <UserPlus size={size} color={c} weight={weight} />;
    case 'user-circle':    return <UserCircle size={size} color={c} weight={weight} />;
    case 'plus':           return <Plus size={size} color={c} weight={weight} />;
    case 'check':          return <Check size={size} color={c} weight={weight} />;
    case 'x':              return <Check size={size} color={c} weight={weight} />;
    case 'arrow-right':    return <ArrowRight size={size} color={c} weight={weight} />;
    case 'arrow-left':     return <ArrowLeft size={size} color={c} weight={weight} />;
    case 'arrow-up-right': return <ArrowUpRight size={size} color={c} weight={weight} />;
    case 'caret-down':     return <CaretDown size={size} color={c} weight={weight} />;
    case 'caret-right':    return <CaretRight size={size} color={c} weight={weight} />;
    case 'caret-up':       return <CaretUp size={size} color={c} weight={weight} />;
    case 'caret-left':     return <CaretLeft size={size} color={c} weight={weight} />;
    case 'clock':          return <Clock size={size} color={c} weight={weight} />;
    case 'play':           return <Play size={size} color={c} weight={weight} />;
    case 'pause':          return <Pause size={size} color={c} weight={weight} />;
    case 'shuffle':        return <Shuffle size={size} color={c} weight={weight} />;
    case 'arrows-clockwise': return <ArrowsClockwise size={size} color={c} weight={weight} />;
    case 'speaker-high':   return <SpeakerHigh size={size} color={c} weight={weight} />;
    case 'globe':          return <Globe size={size} color={c} weight={weight} />;
    case 'envelope':       return <Envelope size={size} color={c} weight={weight} />;
    case 'notebook':       return <Notebook size={size} color={c} weight={weight} />;
    case 'camera':         return <Camera size={size} color={c} weight={weight} />;
    case 'image':          return <Image size={size} color={c} weight={weight} />;
    case 'paper-plane-right': return <PaperPlaneRight size={size} color={c} weight={weight} />;
    case 'paper-plane-tilt':  return <PaperPlaneTilt size={size} color={c} weight={weight} />;
    case 'gear':           return <Gear size={size} color={c} weight={weight} />;
    case 'gear-six':       return <GearSix size={size} color={c} weight={weight} />;
    case 'sliders':        return <SlidersHorizontal size={size} color={c} weight={weight} />;
    case 'sliders-horizontal': return <SlidersHorizontal size={size} color={c} weight={weight} />;
    case 'bell':           return <Bell size={size} color={c} weight={weight} />;
    case 'bell-ringing':   return <BellRinging size={size} color={c} weight={weight} />;
    case 'magnifying-glass': return <MagnifyingGlass size={size} color={c} weight={weight} />;
    case 'funnel':         return <Funnel size={size} color={c} weight={weight} />;
    case 'heart':          return <Heart size={size} color={c} weight={weight} />;
    case 'chat-circle':    return <ChatCircle size={size} color={c} weight={weight} />;
    case 'share-network':  return <ShareNetwork size={size} color={c} weight={weight} />;
    case 'link':           return <Link size={size} color={c} weight={weight} />;
    case 'qr-code':        return <QrCode size={size} color={c} weight={weight} />;
    case 'copy':           return <Copy size={size} color={c} weight={weight} />;
    case 'lock':           return <Lock size={size} color={c} weight={weight} />;
    case 'lock-open':      return <LockOpen size={size} color={c} weight={weight} />;
    case 'fingerprint':    return <View style={{ width: size, height: size, borderRadius: size/2, backgroundColor: c }} />;
    case 'shield':         return <Shield size={size} color={c} weight={weight} />;
    case 'shield-check':   return <ShieldCheck size={size} color={c} weight={weight} />;
    case 'star':           return <Star size={size} color={c} weight={weight} />;
    case 'medal':          return <Medal size={size} color={c} weight={weight} />;
    case 'eye':            return <Eye size={size} color={c} weight={weight} />;
    case 'eye-slash':      return <EyeSlash size={size} color={c} weight={weight} />;
    case 'calendar':       return <Calendar size={size} color={c} weight={weight} />;
    case 'calendar-blank': return <CalendarBlank size={size} color={c} weight={weight} />;
    case 'calendar-check': return <CalendarCheck size={size} color={c} weight={weight} />;
    case 'pencil':         return <PencilSimple size={size} color={c} weight={weight} />;
    case 'pencil-simple':  return <PencilSimple size={size} color={c} weight={weight} />;
    case 'trash':          return <Trash size={size} color={c} weight={weight} />;
    case 'trash-simple':   return <TrashSimple size={size} color={c} weight={weight} />;
    case 'sparkle':        return <Sparkle size={size} color={c} weight={weight} />;
    case 'lightning-slash':return <LightningSlash size={size} color={c} weight={weight} />;
    case 'sun':            return <Sun size={size} color={c} weight={weight} />;
    case 'moon':           return <Moon size={size} color={c} weight={weight} />;
    case 'moon-stars':     return <MoonStars size={size} color={c} weight={weight} />;
    case 'crown':          return <Crown size={size} color={c} weight={weight} />;
    case 'crown-simple':   return <CrownSimple size={size} color={c} weight={weight} />;
    case 'flag':           return <Flag size={size} color={c} weight={weight} />;
    case 'chart-line-up':  return <ChartLineUp size={size} color={c} weight={weight} />;
    case 'chart-bar':      return <ChartBar size={size} color={c} weight={weight} />;
    case 'map-pin':        return <MapPin size={size} color={c} weight={weight} />;
    case 'compass':        return <Compass size={size} color={c} weight={weight} />;
    case 'sign-out':       return <SignOut size={size} color={c} weight={weight} />;
    case 'plus-circle':    return <PlusCircle size={size} color={c} weight={weight} />;
    case 'minus-circle':   return <MinusCircle size={size} color={c} weight={weight} />;
    case 'check-circle':   return <CheckCircle size={size} color={c} weight={weight} />;
    case 'warning':        return <Warning size={size} color={c} weight={weight} />;
    case 'warning-circle': return <WarningCircle size={size} color={c} weight={weight} />;
    case 'info':           return <Info size={size} color={c} weight={weight} />;
    case 'lightbulb':      return <Lightbulb size={size} color={c} weight={weight} />;
    case 'target':         return <Target size={size} color={c} weight={weight} />;
    case 'book':           return <Book size={size} color={c} weight={weight} />;
    case 'barbell':        return <Barbell size={size} color={c} weight={weight} />;
    case 'dumbbell':       return <Barbell size={size} color={c} weight={weight} />;
    case 'yoga':           return <PersonArmsSpread size={size} color={c} weight={weight} />;
    case 'leaf':           return <Leaf size={size} color={c} weight={weight} />;
    case 'music-notes':    return <MusicNotes size={size} color={c} weight={weight} />;
    case 'paint-brush':    return <PaintBrush size={size} color={c} weight={weight} />;
    case 'pen-nib':        return <PenNib size={size} color={c} weight={weight} />;
    case 'pen':            return <PenNib size={size} color={c} weight={weight} />;
    case 'paw-print':      return <PawPrint size={size} color={c} weight={weight} />;
    case 'drop':           return <Drop size={size} color={c} weight={weight} />;
    case 'snowflake':      return <Snowflake size={size} color={c} weight={weight} />;
    case 'sun-horizon':    return <SunHorizon size={size} color={c} weight={weight} />;
    case 'hand-waving':    return <HandWaving size={size} color={c} weight={weight} />;
    case 'hourglass':      return <Hourglass size={size} color={c} weight={weight} />;
    case 'hourglass-medium': return <HourglassMedium size={size} color={c} weight={weight} />;
    case 'dot':            return <View style={{ width: size, height: size, borderRadius: size/2, backgroundColor: c }} />;
    case 'dots-three':     return <DotsThree size={size} color={c} weight={weight} />;
    case 'dots-three-vertical': return <DotsThreeVertical size={size} color={c} weight={weight} />;
    case 'rocket':         return <Rocket size={size} color={c} weight={weight} />;
    case 'code':           return <Code size={size} color={c} weight={weight} />;
    default:               return <View style={{ width: size, height: size }} />;
  }
}

export default PhosphorIcon;
