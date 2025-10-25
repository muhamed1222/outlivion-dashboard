import pino from 'pino'

/**
 * Environment-aware logger for server-side code
 * - Development: Pretty-printed console output
 * - Production: Structured JSON logs
 */

const isDevelopment = process.env.NODE_ENV === 'development'

// Create Pino logger instance
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  // In development, use pretty printing
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
  // Base fields to include in all logs
  base: {
    env: process.env.NODE_ENV,
  },
  // Serializers for common objects
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
})

/**
 * Logger interface with structured logging support
 */
export interface LogContext {
  event_type?: string
  source?: string
  [key: string]: any
}

/**
 * Server-side logger with structured fields
 */
export const logger = {
  /**
   * Log informational message
   * @param context - Structured context data
   * @param message - Human-readable message
   */
  info: (context: LogContext, message?: string) => {
    if (message) {
      pinoLogger.info(context, message)
    } else {
      pinoLogger.info(context)
    }
  },

  /**
   * Log warning message
   * @param context - Structured context data
   * @param message - Human-readable message
   */
  warn: (context: LogContext, message?: string) => {
    if (message) {
      pinoLogger.warn(context, message)
    } else {
      pinoLogger.warn(context)
    }
  },

  /**
   * Log error message
   * @param context - Structured context data (can include error object)
   * @param message - Human-readable message
   */
  error: (context: LogContext | Error, message?: string) => {
    if (context instanceof Error) {
      pinoLogger.error({ err: context }, message || context.message)
    } else if (message) {
      pinoLogger.error(context, message)
    } else {
      pinoLogger.error(context)
    }
  },

  /**
   * Log debug message (only in development)
   * @param context - Structured context data
   * @param message - Human-readable message
   */
  debug: (context: LogContext, message?: string) => {
    if (message) {
      pinoLogger.debug(context, message)
    } else {
      pinoLogger.debug(context)
    }
  },

  /**
   * Create child logger with predefined context
   * Useful for maintaining context across multiple log calls
   */
  child: (bindings: LogContext) => {
    const childLogger = pinoLogger.child(bindings)
    return {
      info: (context: LogContext, message?: string) => {
        if (message) {
          childLogger.info(context, message)
        } else {
          childLogger.info(context)
        }
      },
      warn: (context: LogContext, message?: string) => {
        if (message) {
          childLogger.warn(context, message)
        } else {
          childLogger.warn(context)
        }
      },
      error: (context: LogContext | Error, message?: string) => {
        if (context instanceof Error) {
          childLogger.error({ err: context }, message || context.message)
        } else if (message) {
          childLogger.error(context, message)
        } else {
          childLogger.error(context)
        }
      },
      debug: (context: LogContext, message?: string) => {
        if (message) {
          childLogger.debug(context, message)
        } else {
          childLogger.debug(context)
        }
      },
    }
  },
}

export default logger

