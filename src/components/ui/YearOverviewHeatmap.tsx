import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from './Text';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';

export interface HeatmapDay {
  date: string;
  count: number;
}

interface YearOverviewHeatmapProps {
  data: HeatmapDay[];
  style?: any;
  onDayPress?: (day: HeatmapDay) => void;
}

const WEEKDAYS = ['Mon', 'Wed', 'Fri'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function YearOverviewHeatmap({ data, style, onDayPress }: YearOverviewHeatmapProps) {
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
    if (count === 0) return COLORS.bgBase;
    if (count === 1) return COLORS.positive + '40'; // 25% opacity
    if (count === 2) return COLORS.positive + '80'; // 50% opacity
    if (count === 3) return COLORS.positive + 'C0'; // 75% opacity
    return COLORS.positive; // 100%
  };

  return (
    <View style={[styles.container, style]}>
      <Text variant="eyebrow" color={COLORS.textSecondary} style={styles.title}>
        Year Overview
      </Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartWrapper}>
          
          <View style={styles.labelsCol}>
            {/* Offset to align with rows */}
            <View style={{ height: 20 }} /> 
            {WEEKDAYS.map((d, i) => (
              <Text key={d} style={[styles.labelText, { marginTop: i === 0 ? 14 : 28 }]}>
                {d}
              </Text>
            ))}
          </View>
          
          <View style={styles.chartMain}>
            <View style={styles.monthsRow}>
              {MONTHS.map((m, i) => (
                <Text key={m} style={styles.labelText}>
                  {m}
                </Text>
              ))}
            </View>
            <View style={styles.grid}>
              {grid.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {row.map((day, colIndex) => {
                    if (!day) return <View key={colIndex} style={styles.cellEmpty} />;
                    return (
                      <Pressable
                        key={colIndex}
                        onPress={() => onDayPress?.(day)}
                        style={[styles.cell, { backgroundColor: getColor(day.count) }]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>

      <View style={styles.legend}>
        <Text variant="caption" color={COLORS.textTertiary}>Less</Text>
        {[0, 1, 2, 3, 4].map(level => (
          <View key={level} style={[styles.legendCell, { backgroundColor: getColor(level) }]} />
        ))}
        <Text variant="caption" color={COLORS.textTertiary}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgPanel,
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
    color: COLORS.textTertiary,
  },
  chartMain: {
    flex: 1,
  },
  monthsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACE.sm,
    paddingRight: SPACE.md,
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
