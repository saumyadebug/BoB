import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from './Text';
import { Card } from './Card';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';

interface PreviewCardProps {
  activityName: string;
  activityIcon: string;
  activityColor: string;
  photoUri?: string | null;
  title?: string;
  description?: string;
  formData: Record<string, any>;
}

export function PreviewCard({ activityName, activityIcon, activityColor, photoUri, title, description, formData }: PreviewCardProps) {
  return (
    <Card variant="outline" padding="none" style={styles.card}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.image} />
      ) : null}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: activityColor + '20' }]}>
            <Text style={{ fontSize: 16 }}>{activityIcon}</Text>
          </View>
          <Text variant="headingSm" color={COLORS.inkDisplay}>{activityName}</Text>
        </View>

        {title ? <Text variant="headingMd" color={COLORS.inkDisplay} style={styles.title}>{title}</Text> : null}
        {description ? <Text variant="body" color={COLORS.inkSecondary} style={styles.desc}>{description}</Text> : null}

        <View style={styles.dataGrid}>
          {Object.entries(formData).map(([key, val]) => {
            if (val === undefined || val === null || val === '') return null;
            return (
              <View key={key} style={styles.dataItem}>
                <Text variant="caption" color={COLORS.inkTertiary} style={styles.dataKey}>{key}</Text>
                <Text variant="label" color={COLORS.inkPrimary}>
                  {Array.isArray(val) ? val.join(', ') : String(val)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 4/5, backgroundColor: COLORS.surfaceSunken },
  content: { padding: SPACE.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  iconBox: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: 4 },
  desc: { marginBottom: 16 },
  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.hairline },
  dataItem: { width: '45%' },
  dataKey: { marginBottom: 2, textTransform: 'capitalize' },
});

export default PreviewCard;
