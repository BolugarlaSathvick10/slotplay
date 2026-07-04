/**
 * middleware/validate.ts
 *
 * Generic Zod validation middleware factory.
 * Validates req.body against a Zod schema and calls next(error) on failure.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), authController.register);
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '@/utils/AppError';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Format Zod errors into Record<field, messages[]>
      const errors: Record<string, string[]> = {};

      (result.error as ZodError).issues.forEach((issue) => {
        const field = issue.path.join('.') || 'root';
        if (!errors[field]) errors[field] = [];
        errors[field].push(issue.message);
      });

      const firstError = Object.values(errors)[0]?.[0] ?? 'Validation failed';

      const error = new AppError(firstError, 422, 'VALIDATION_ERROR') as AppError & {
        validationErrors: Record<string, string[]>;
      };
      error.validationErrors = errors;

      next(error);
      return;
    }

    // Replace req.body with the parsed (coerced + stripped) data
    req.body = result.data;
    next();
  };
}
