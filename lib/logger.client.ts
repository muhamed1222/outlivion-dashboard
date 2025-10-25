/**
 * Client-side logger for browser contexts
 * Uses console API with structured formatting
 */

export interface LogContext {
  event_type?: string
  source?: string
  [key: string]: any
}

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Format structured context for console output
 */
function formatContext(context: LogContext, message?: string): [string, any] {
  const { event_type, source, ...rest } = context
  const prefix = [source, event_type].filter(Boolean).join(':')
  const formattedMessage = prefix ? `[${prefix}] ${message || ''}` : message || ''
  return [formattedMessage, rest]
}

/**
 * Client-side logger with structured fields
 * Maintains same interface as server logger but uses console API
 */
export const logger = {
  /**
   * Log informational message
   * @param context - Structured context data
   * @param message - Human-readable message
   */
  info: (context: LogContext, message?: string) => {
    const [formattedMessage, data] = formatContext(context, message)
    if (Object.keys(data).length > 0) {
      console.log(formattedMessage, data)
    } else {
      console.log(formattedMessage)
    }
  },

  /**
   * Log warning message
   * @param context - Structured context data
   * @param message - Human-readable message
   */
  warn: (context: LogContext, message?: string) => {
    const [formattedMessage, data] = formatContext(context, message)
    if (Object.keys(data).length > 0) {
      console.warn(formattedMessage, data)
    } else {
      console.warn(formattedMessage)
    }
  },

  /**
   * Log error message
   * @param context - Structured context data (can include error object)
   * @param message - Human-readable message
   */
  error: (context: LogContext | Error, message?: string) => {
    if (context instanceof Error) {
      console.error(message || context.message, context)
    } else {
      const [formattedMessage, data] = formatContext(context, message)
      if (Object.keys(data).length > 0) {
        console.error(formattedMessage, data)
      } else {
        console.error(formattedMessage)
      }
    }
  },

  /**
   * Log debug message (only in development)
   * @param context - Structured context data
   * @param message - Human-readable message
   */
  debug: (context: LogContext, message?: string) => {
    if (!isDevelopment) return

    const [formattedMessage, data] = formatContext(context, message)
    if (Object.keys(data).length > 0) {
      console.debug(formattedMessage, data)
    } else {
      console.debug(formattedMessage)
    }
  },

  /**
   * Create child logger with predefined context
   * Useful for maintaining context across multiple log calls
   */
  child: (bindings: LogContext) => {
    return {
      info: (context: LogContext, message?: string) =>
        logger.info({ ...bindings, ...context }, message),
      warn: (context: LogContext, message?: string) =>
        logger.warn({ ...bindings, ...context }, message),
      error: (context: LogContext | Error, message?: string) =>
        logger.error(context instanceof Error ? context : { ...bindings, ...context }, message),
      debug: (context: LogContext, message?: string) =>
        logger.debug({ ...bindings, ...context }, message),
    }
  },
}

export default logger

