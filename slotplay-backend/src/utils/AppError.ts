/**
 * utils/AppError.ts
 *
 * Typed application error that carries an HTTP status code.
 * Thrown from services and controllers; caught by the global error middleware.
 *
 * Usage:
 *   throw new AppError('Venue not found', 404);
 *   throw new AppError('Unauthorised', 401, 'AUTH_REQUIRED');
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Restore prototype chain (required when extending built-in classes in TS)
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace (V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /** Shorthand constructors for common error types */
  static notFound(resource = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static unauthorised(message = 'Authentication required'): AppError {
    return new AppError(message, 401, 'UNAUTHORISED');
  }

  static forbidden(message = 'Access denied'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400, 'BAD_REQUEST');
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, 'CONFLICT');
  }
}
