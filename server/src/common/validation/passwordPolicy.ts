import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const result = passwordSchema.safeParse(password);
  if (result.success) {
    return { isValid: true, errors: [] };
  }
  return {
    isValid: false,
    errors: result.error.errors.map((e) => e.message),
  };
}
