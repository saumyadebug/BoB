import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch, TextInput, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';
import { FieldDefinition } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon, IconName } from './Icon';

interface DynamicFormProps {
  fields: FieldDefinition[];
  onSubmit: (data: Record<string, any>) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const generateSchema = (fields: FieldDefinition[]) => {
  const schemaShape: any = {};
  fields.forEach(f => {
    let fieldSchema: z.ZodTypeAny;
    switch (f.type) {
      case 'text':
      case 'singleselect':
        fieldSchema = z.string();
        if (f.required) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, 'Required');
        } else {
          fieldSchema = fieldSchema.optional();
        }
        break;
      case 'number':
        fieldSchema = z.coerce.number();
        if (!f.required) fieldSchema = fieldSchema.optional();
        break;
      case 'multiselect':
        fieldSchema = z.array(z.string());
        if (f.required) {
          fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(1, 'Select at least one');
        } else {
          fieldSchema = fieldSchema.optional().default([]);
        }
        break;
      case 'toggle':
        fieldSchema = z.boolean();
        if (!f.required) fieldSchema = fieldSchema.optional().default(false);
        break;
      case 'stars':
      case 'emoji-scale':
        fieldSchema = z.number().min(1, 'Required').max(5);
        if (!f.required) fieldSchema = fieldSchema.optional();
        break;
      default:
        fieldSchema = z.any();
    }
    schemaShape[f.id] = fieldSchema;
  });
  return z.object(schemaShape);
};

export function DynamicForm({ fields, onSubmit, submitLabel = 'Submit', isSubmitting = false }: DynamicFormProps) {
  const schema = useMemo(() => generateSchema(fields), [fields]);

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce((acc, f) => {
      if (f.type === 'multiselect') acc[f.id] = [];
      else if (f.type === 'toggle') acc[f.id] = false;
      else if (f.type === 'number' || f.type === 'stars' || f.type === 'emoji-scale') acc[f.id] = undefined;
      else acc[f.id] = '';
      return acc;
    }, {} as any),
  });

  // Watch all field values so we can evaluate showIf conditions live.
  const values = watch();

  // Filter fields by showIf. A field with no showIf always renders.
  const visibleFields = fields.filter((f) => {
    if (!f.showIf) return true;
    return values[f.showIf.fieldId] === f.showIf.equals;
  });

  return (
    <View style={styles.formContainer}>
      {visibleFields.map(field => (
        <FieldRenderer
          key={field.id}
          field={field}
          control={control}
          error={errors[field.id]?.message as string | undefined}
        />
      ))}

      <View style={styles.submitWrapper}>
        <Button
          label={isSubmitting ? 'Submittingâ€¦' : submitLabel}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          fullWidth
          trailingIcon="paper-plane-right"
        />
      </View>
    </View>
  );
}

function FieldRenderer({ field, control, error }: { field: FieldDefinition; control: any; error?: string }) {
  return (
    <View style={styles.fieldWrapper}>
      <View style={styles.labelRow}>
        <Text variant="headingSm" style={styles.label}>
          {field.label}
          {field.required && <Text variant="headingSm" color={COLORS.accentBlue}> *</Text>}
        </Text>
        {field.unit ? (
          <Text variant="caption" color={COLORS.textSecondary}>({field.unit})</Text>
        ) : null}
      </View>

      <Controller
        control={control}
        name={field.id}
        render={({ field: { onChange, value } }) => (
          <View>
            {renderField(field, onChange, value)}
          </View>
        )}
      />

      {error ? (
        <Text variant="caption" color={COLORS.danger} style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function renderField(field: FieldDefinition, onChange: any, value: any) {
  switch (field.type) {
    case 'text':
      return (
        <Input
          value={value ?? ''}
          onChangeText={onChange}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          maxLength={field.maxLength}
        />
      );
    case 'number':
      return (
        <Input
          value={value !== undefined && value !== null ? String(value) : ''}
          onChangeText={(t) => onChange(t === '' ? undefined : Number(t))}
          placeholder="0"
          keyboardType="numeric"
          maxLength={field.maxLength}
        />
      );
    case 'multiselect':
      return (
        <View style={styles.chipContainer}>
          {field.options?.map(opt => {
            const isSelected = Array.isArray(value) && value.includes(opt);
            return (
              <Pressable
                key={opt}
                onPress={() => {
                  const current = Array.isArray(value) ? value : [];
                  onChange(isSelected ? current.filter(i => i !== opt) : [...current, opt]);
                }}
                style={[
                  styles.formChip,
                  isSelected ? styles.formChipActive : null,
                ]}
              >
                <Text
                  variant="label"
                  color={isSelected ? COLORS.bgBase : COLORS.textPrimary}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    case 'singleselect':
      return (
        <View style={styles.chipContainer}>
          {field.options?.map(opt => (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={[styles.formChip, value === opt ? styles.formChipActive : null]}
            >
              <Text
                variant="label"
                color={value === opt ? COLORS.bgBase : COLORS.textPrimary}
              >
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      );
    case 'toggle':
      return (
        <View style={styles.toggleRow}>
          <Text variant="bodySm" color={COLORS.textSecondary}>
            {value ? 'On' : 'Off'}
          </Text>
          <Switch
            value={!!value}
            onValueChange={onChange}
            trackColor={{ false: COLORS.hairlineStrong, true: COLORS.accentBlue }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={COLORS.hairlineStrong}
          />
        </View>
      );
    case 'stars':
    case 'emoji-scale':
      return (
        <RatingRow type={field.type} value={value} onChange={onChange} />
      );
    default:
      return null;
  }
}

function RatingRow({ type, value, onChange }: { type: 'stars' | 'emoji-scale'; value: any; onChange: (v: number) => void }) {
  const ratings: IconName[] = type === 'emoji-scale'
    ? ['smiley-meh', 'smiley', 'sparkle', 'star', 'lightning']
    : ['star', 'star', 'star', 'star', 'star'];
  return (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map(num => {
        const active = value === num;
        const isIcon = type === 'stars';
        return (
          <RatingCell
            key={num}
            active={active}
            onPress={() => onChange(num)}
          >
            <Icon
              name={ratings[num - 1]}
              size={type === 'emoji-scale' ? 30 : 28}
              color={active ? COLORS.accentBlue : COLORS.textTertiary}
              bold={active && isIcon}
            />
          </RatingCell>
        );
      })}
    </View>
  );
}

function RatingCell({ active, onPress, children }: { active: boolean; onPress: () => void; children: React.ReactNode }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.92, { damping: 18, stiffness: 320 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 320 }); }}
      onPress={onPress}
      style={[styles.ratingCell, active ? styles.ratingCellActive : null]}
    >
      <Animated.View style={animStyle}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  fieldWrapper: {
    marginBottom: 28,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    gap: 8,
  },
  label: {
    color: COLORS.textPrimary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  formChipActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgSurface,
    padding: 6,
    borderRadius: RADIUS.lg,
  },
  ratingCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  ratingCellActive: {
    backgroundColor: COLORS.bgPanel,
    ...SHADOWS.card,
  },
  errorText: {
    marginTop: 6,
  },
  submitWrapper: {
    marginTop: 16,
    marginBottom: 40,
  },
});

export default DynamicForm;
