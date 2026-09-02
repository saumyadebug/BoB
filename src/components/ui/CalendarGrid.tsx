import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { COLORS, TYPOGRAPHY, RADIUS, SPACE } from '@/constants/theme';

export interface CalendarDayData {
  date: Date;
  dots: string[]; // array of colors
}

interface CalendarGridProps {
  data: Record<string, string[]>; // Map 'YYYY-MM-DD' to array of colors
  onPressDay?: (date: Date) => void;
  style?: any;
}

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export function CalendarGrid({ data, onPressDay, style }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Make Monday 0

    const days = [];

    // Previous month padding
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill 42 cells (6 rows)
    let nextMonthDay = 1;
    while (days.length < 42) {
      days.push({
        date: new Date(year, month + 1, nextMonthDay++),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.navRow}>
          <Pressable onPress={handlePrevMonth} style={styles.navBtn}>
            <Icon name="arrow-left" size={20} color={COLORS.inkPrimary} />
          </Pressable>
          <Pressable onPress={handleNextMonth} style={styles.navBtn}>
            <Icon name="arrow-right" size={20} color={COLORS.inkPrimary} />
          </Pressable>
        </View>
        <Text variant="headingLg" color={COLORS.inkDisplay} style={styles.monthTitle}>
          {MONTHS[month]} <Text style={{ color: COLORS.inkSecondary }}>{year}</Text>
        </Text>
      </View>

      <View style={styles.weekDays}>
        {DAYS_OF_WEEK.map((d) => (
          <Text key={d} style={styles.weekDayText}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {daysInMonth.map((dayObj, i) => {
          const dateStr = formatDateStr(dayObj.date);
          const dots = data[dateStr] || [];

          return (
            <Pressable
              key={i}
              style={[styles.cell, !dayObj.isCurrentMonth && styles.cellInactive]}
              onPress={() => onPressDay?.(dayObj.date)}
              disabled={!dayObj.isCurrentMonth}
            >
              <Text style={[styles.cellDate, !dayObj.isCurrentMonth && { color: COLORS.inkTertiary }]}>
                {dayObj.date.getDate()}
              </Text>
              <View style={styles.dotsRow}>
                {dots.map((color, index) => (
                  <View key={index} style={[styles.dot, { backgroundColor: color }]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: SPACE.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACE.xl,
  },
  navRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    marginRight: SPACE.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    flex: 1,
    textAlign: 'center',
    marginRight: 36 * 2 + SPACE.xs + SPACE.md, // offset nav buttons for center alignment
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: SPACE.md,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    ...TYPOGRAPHY.eyebrow,
    color: COLORS.inkTertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%',
    aspectRatio: 0.8,
    padding: SPACE.xs,
    alignItems: 'flex-start',
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.surfaceBase,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cellInactive: {
    backgroundColor: 'transparent',
  },
  cellDate: {
    ...TYPOGRAPHY.label,
    color: COLORS.inkPrimary,
    marginBottom: SPACE.xs,
  },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.pill,
  },
});
