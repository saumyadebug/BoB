import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from './Text';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';

export interface HeatmapDay {
  date: string;
  count: number;
}

interface YearOverviewHeatmapProps {
  data: HeatmapDay[];
  style?: any;
}

const WEEKDAYS = ['Mon', 'Wed', 'Fri'];

export function YearOverviewHeatmap({ data, style }: YearOverviewHeatmapProps) {
  // Convert 1D array to 2D array [7 rows][52 columns]
  const grid = useMemo(() => {
    const cols = 52;
    const rows = 7;
    const result: HeatmapDay[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

    data.forEach((day, i) => {
      if (i >= rows * cols) return;
      const col = Math.floor(i / rows);
      const row = i % rows;
      result[row][col] = day;
    });

    return result;
  }, [data]);

  const getColor = (count: number) => {
    if (count === 0) return COLORS.surfaceBase;
    if (count === 1) return COLORS.positive + '40'; // 25% opacity
    if (count === 2) return COLORS.positive + '80'; // 50% opacity
    if (count === 3) return COLORS.positive + 'C0'; // 75% opacity
    return COLORS.positive; // 100%
  };

  return (
    <View style={[styles.container, style]}>
      <Text variant="eyebrow" color={COLORS.inkSecondary} style={styles.title}>
        Year Overview
      </Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartWrapper}>
          
          <View style={styles.labelsCol}>
            {WEEKDAYS.map((d, i) => (
              <Text key={d} style={[styles.labelText, { marginTop: i === 0 ? 14 : 28 }]}>
                {d}
              </Text>
            ))}
          </View>
          
          <View style={styles.grid}>
            {grid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((day, colIndex) => {
                  if (!day) return <View key={colIndex} style={styles.cellEmpty} />;
                  return (
                    <View
                      key={colIndex}
                      style={[styles.cell, { backgroundColor: getColor(day.count) }]}
                    />
                  );
                })}
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      <View style={styles.legend}>
        <Text variant="caption" color={COLORS.inkTertiary}>Less</Text>
        {[0, 1, 2, 3, 4].map(level => (
          <View key={level} style={[styles.legendCell, { backgroundColor: getColor(level) }]} />
        ))}
        <Text variant="caption" color={COLORS.inkTertiary}>More</Text>
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
  title: {
    marginBottom: SPACE.md,
  },
  chartWrapper: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  labelsCol: {
    width: 24,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  labelText: {
    fontSize: 10,
    color: COLORS.inkTertiary,
  },
  grid: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  cellEmpty: {
    width: 12,
    height: 12,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACE.md,
    gap: 6,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
