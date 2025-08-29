import winston from 'winston';
import path from 'path';

/**
 * Centralized logging configuration for SecureSync Pro
 */

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4,
  silly: 5,
  critical: 0,  // Alias for error with critical severity
  security: 1   // Alias for warn with security context
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  verbose: 'cyan',
  silly: 'magenta',
  critical: 'red bold',
  security: 'yellow bold'
};

// Add custom colors to winston
winston.addColors(logColors);

// Custom format for production logs
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = {
      timestamp,
      level,
      message,
      ...(stack ? { stack } : {}),
      ...(Object.keys(meta).length > 0 && { meta })
    };
    return JSON.stringify(log);
  })
);

// Custom format for development logs
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Create transports based on environment
const transports: winston.transport[] = [
  // Console transport - always present
  new winston.transports.Console({
    level: logLevel,
    format: isDevelopment ? developmentFormat : productionFormat,
    stderrLevels: ['error', 'critical', 'security']
  })
];

// File transports for production
if (isProduction || process.env.LOG_TO_FILE === 'true') {
  const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
  
  // General application logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'application.log'),
      level: 'info',
      format: productionFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true
    })
  );

  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true
    })
  );

  // Security logs - separate file for security events
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      level: 'security',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level: 'SECURITY',
            message,
            ...meta
          });
        })
      ),
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10,
      tailable: true
    })
  );

  // Audit logs for compliance
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'audit.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          // Only log audit events
          if (meta.audit === true) {
            return JSON.stringify({
              timestamp,
              level: 'AUDIT',
              message,
              ...meta
            });
          }
          return '';
        })
      ),
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 20,
      tailable: true
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: logLevel,
  format: isProduction ? productionFormat : developmentFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || 'logs', 'exceptions.log'),
      format: productionFormat
    })
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || 'logs', 'rejections.log'),
      format: productionFormat
    })
  ]
});

// Enhanced logger with custom methods
export class EnhancedLogger {
  private winston: winston.Logger;

  constructor(winstonLogger: winston.Logger) {
    this.winston = winstonLogger;
  }

  // Standard log methods
  error(message: string, meta?: any): void {
    this.winston.error(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.winston.warn(message, meta);
  }

  info(message: string, meta?: any): void {
    this.winston.info(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.winston.debug(message, meta);
  }

  verbose(message: string, meta?: any): void {
    this.winston.verbose(message, meta);
  }

  silly(message: string, meta?: any): void {
    this.winston.silly(message, meta);
  }

  // Custom security logging
  security(message: string, meta?: any): void {
    this.winston.log('security', message, { 
      ...meta, 
      security: true,
      severity: meta?.severity || 'medium',
      component: meta?.component || 'unknown',
      userId: meta?.userId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });
  }

  // Critical error logging
  critical(message: string, meta?: any): void {
    this.winston.log('critical', message, { 
      ...meta, 
      critical: true,
      timestamp: new Date().toISOString(),
      severity: 'critical'
    });
  }

  // Audit logging for compliance
  audit(action: string, meta?: any): void {
    this.winston.info(`AUDIT: ${action}`, { 
      ...meta, 
      audit: true,
      action,
      timestamp: new Date().toISOString(),
      compliance: true
    });
  }

  // Performance logging
  performance(operation: string, duration: number, meta?: any): void {
    this.winston.info(`PERFORMANCE: ${operation} completed in ${duration}ms`, {
      ...meta,
      performance: true,
      operation,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  // API request logging
  apiRequest(method: string, url: string, statusCode: number, duration: number, meta?: any): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.winston.log(level, `API ${method} ${url} ${statusCode} ${duration}ms`, {
      ...meta,
      api: true,
      method,
      url,
      statusCode,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  // User activity logging
  userActivity(userId: string, activity: string, meta?: any): void {
    this.winston.info(`USER: ${userId} ${activity}`, {
      ...meta,
      userActivity: true,
      userId,
      activity,
      timestamp: new Date().toISOString()
    });
  }

  // Meeting activity logging
  meetingActivity(meetingId: string, activity: string, meta?: any): void {
    this.winston.info(`MEETING: ${meetingId} ${activity}`, {
      ...meta,
      meetingActivity: true,
      meetingId,
      activity,
      timestamp: new Date().toISOString()
    });
  }

  // WebSocket connection logging
  websocket(socketId: string, event: string, meta?: any): void {
    this.winston.debug(`WEBSOCKET: ${socketId} ${event}`, {
      ...meta,
      websocket: true,
      socketId,
      event,
      timestamp: new Date().toISOString()
    });
  }

  // Database operation logging
  database(operation: string, collection: string, duration: number, meta?: any): void {
    this.winston.debug(`DATABASE: ${operation} on ${collection} (${duration}ms)`, {
      ...meta,
      database: true,
      operation,
      collection,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  // Cache operation logging
  cache(operation: string, key: string, hit: boolean, meta?: any): void {
    this.winston.debug(`CACHE: ${operation} ${key} ${hit ? 'HIT' : 'MISS'}`, {
      ...meta,
      cache: true,
      operation,
      key,
      hit,
      timestamp: new Date().toISOString()
    });
  }

  // External service logging
  externalService(service: string, operation: string, success: boolean, duration: number, meta?: any): void {
    const level = success ? 'info' : 'warn';
    this.winston.log(level, `EXTERNAL: ${service} ${operation} ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`, {
      ...meta,
      externalService: true,
      service,
      operation,
      success,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  // Create child logger with context
  child(context: any): EnhancedLogger {
    const childLogger = this.winston.child(context);
    return new EnhancedLogger(childLogger);
  }

  // Timer utility for performance measurement
  timer(label: string): { end: () => void } {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        this.performance(label, duration);
      }
    };
  }

  // Stream for HTTP request logging
  getStream(): any {
    return {
      write: (message: string) => {
        this.winston.info(message.trim());
      }
    };
  }
  
}

// Create enhanced logger instance
const enhancedLogger = new EnhancedLogger(logger);

// Add request ID middleware support
export const addRequestId = (req: any, res: any, next: any) => {
  req.requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  
  // Add request ID to logger context
  req.logger = enhancedLogger.child({ requestId: req.requestId });
  
  next();
};

// Export the enhanced logger as default
export { enhancedLogger as logger };

// Export logger factory for creating module-specific loggers
export const createLogger = (module: string): EnhancedLogger => {
  return enhancedLogger.child({ module });
};

// Export log levels for external use
export const LOG_LEVELS = logLevels;

// Helper function to set log level dynamically
export const setLogLevel = (level: string): void => {
   (logger as any)['winston'].level = level;
};

// Helper function to check if a log level is enabled
export const isLogLevelEnabled = (level: string): boolean => {
  return (logger as any)['winston'].isLevelEnabled(level);
};
