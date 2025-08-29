import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiError } from '../../../shared/src/types/index';

/**
 * Global error handler middleware for Express
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: (req as any).user?.id,
    requestId: (req as any).requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An internal server error occurred';
  let details: any = undefined;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = isDevelopment ? error.details : undefined;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
    message = 'Access denied';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = 'Resource not found';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    errorCode = 'CONFLICT';
    message = 'Resource conflict';
  } else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    errorCode = 'TOO_MANY_REQUESTS';
    message = 'Rate limit exceeded';
  } else if (error.statusCode && error.code) {
    // Custom API errors
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = isDevelopment ? error.details : undefined;
  } else if (isDevelopment) {
    // In development, expose more error details
    message = error.message || message;
    details = {
      stack: error.stack,
      ...error.details
    };
  }

  const apiError: ApiError = {
    code: errorCode,
    message,
    details,
    timestamp: new Date()
  };

  res.status(statusCode).json({
    success: false,
    error: apiError
  });
};

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error: ApiError = {
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date()
  };

  logger.warn('Route not found:', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    success: false,
    error
  });
};

/**
 * Async error wrapper for Express route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error classes for specific error types
 */
export class CustomError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number, code: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class TooManyRequestsError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

export class SecurityError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 403, 'SECURITY_ERROR', details);
    
    // Log security errors immediately
    logger.security('Security error occurred', {
      message,
      details,
      timestamp: new Date()
    });
  }
}
