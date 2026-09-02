import { PRESET_ACTIVITIES, ActivityTemplate } from '@/constants/activityTemplates';
import { FieldDefinition, ActivityFrequency } from '@/types';

/**
 * Activity templates service.
 *
 * Wraps the static `PRESET_ACTIVITIES` config in a service-shaped API
 * so the app code is identical to when these are DB-backed
 * (Phase 8+ if we want admin-managed templates).
 *
 * The shape of the methods mirrors what a Supabase RPC would look like.
 */

export type ActivityCategory = 'fitness' | 'learning' | 'mindfulness' | 'productivity' | 'lifestyle';

const CATEGORY_BY_ID: Record<string, ActivityCategory> = {
  gym: 'fitness',
  run: 'fitness',
  study: 'learning',
  read: 'learning',
  code: 'productivity',
  meditate: 'mindfulness',
  water: 'lifestyle',
  coldShower: 'lifestyle',
  language: 'learning',
  music: 'lifestyle',
};

function inferCategory(template: ActivityTemplate): ActivityCategory {
  return CATEGORY_BY_ID[template.id] ?? 'lifestyle';
}

export interface ActivityTemplateSummary {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: ActivityCategory;
  requirePhoto: boolean;
  defaultFrequency: ActivityFrequency;
  defaultFrequencyDays: number[];
  fieldCount: number;
}

export interface ActivityTemplateDetail extends ActivityTemplateSummary {
  templateFields: FieldDefinition[];
}

export const activityTemplateService = {
  /**
   * All templates, summarized. For template-picker UI.
   */
  async getAll(): Promise<ActivityTemplateSummary[]> {
    return PRESET_ACTIVITIES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      color: t.color,
      category: inferCategory(t),
      requirePhoto: t.requirePhoto,
      defaultFrequency: t.frequency,
      defaultFrequencyDays: t.frequencyDays,
      fieldCount: t.templateFields.length,
    }));
  },

  /**
   * Full template (with field definitions) for one template.
   */
  async getById(id: string): Promise<ActivityTemplateDetail | null> {
    const t = PRESET_ACTIVITIES.find((x) => x.id === id);
    if (!t) return null;
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      color: t.color,
      category: inferCategory(t),
      requirePhoto: t.requirePhoto,
      defaultFrequency: t.frequency,
      defaultFrequencyDays: t.frequencyDays,
      fieldCount: t.templateFields.length,
      templateFields: t.templateFields,
    };
  },

  /**
   * Templates filtered by category. Returns summaries.
   */
  async getByCategory(category: ActivityCategory): Promise<ActivityTemplateSummary[]> {
    const all = await this.getAll();
    return all.filter((t) => t.category === category);
  },
  /**
   * Validate a template's field IDs are unique within each template. Returns
   * duplicates for any template where the same field id appears more than once.
   *
   * Note: this checks within-template uniqueness, not cross-template. Two
   * different templates can each have a field called "duration" — that's
   * fine because they're independent forms.
   */
  validateAll(): { ok: true } | { ok: false; duplicates: Array<{ templateId: string; fieldId: string }> } {
    const dupes: Array<{ templateId: string; fieldId: string }> = [];
    for (const t of PRESET_ACTIVITIES) {
      const seen = new Set<string>();
      for (const f of t.templateFields) {
        if (seen.has(f.id)) dupes.push({ templateId: t.id, fieldId: f.id });
        seen.add(f.id);
      }
    }
    return dupes.length > 0 ? { ok: false, duplicates: dupes } : { ok: true };
  },
};

export type { ActivityTemplate };

// Dev-time check: fail loudly if a template has duplicate field IDs.
if (__DEV__) {
  const v = activityTemplateService.validateAll();
  if (!v.ok) {
    console.warn(
      '[activityTemplateService] duplicate field IDs found:\n' +
        v.duplicates.map((d) => `  - ${d.templateId}.${d.fieldId}`).join('\n')
    );
  }
}
