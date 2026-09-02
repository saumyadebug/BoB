import { z } from 'zod';

/**
 * Centralized auth form validation schemas.
 *
 * Each schema returns a Zod schema, so the form is fully type-safe and
 * the inferred TypeScript type matches the runtime validator.
 */

// ─── Login ──────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'At least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Register ───────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email'),
    password: z
      .string()
      .min(6, 'At least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Username (profile setup) ──────────────────────────────────────────────

export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

export const usernameSchema = z
  .string()
  .min(USERNAME_MIN, `At least ${USERNAME_MIN} characters`)
  .max(USERNAME_MAX, `Maximum ${USERNAME_MAX} characters`)
  .regex(USERNAME_REGEX, 'Letters, numbers, and underscore only');

export const profileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().max(40, 'Maximum 40 characters').optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// ─── Password strength (visual only) ────────────────────────────────────────

export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'excellent';

export function evaluatePasswordStrength(pw: string): {
  strength: PasswordStrength;
  score: 0 | 1 | 2 | 3;
  label: string;
} {
  if (!pw) return { strength: 'weak', score: 0, label: 'Empty' };

  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  // Cap at 3 for our 4-bar display
  const capped = Math.min(3, score) as 0 | 1 | 2 | 3;

  const map: Record<number, { strength: PasswordStrength; label: string }> = {
    0: { strength: 'weak', label: 'Too weak' },
    1: { strength: 'weak', label: 'Weak' },
    2: { strength: 'fair', label: 'Fair' },
    3: { strength: 'strong', label: 'Strong' },
  };

  return { strength: map[capped].strength, score: capped, label: map[capped].label };
}
