import { z } from 'zod'

/**
 * Validation schemas for API endpoints
 * Provides type-safe input validation and sanitization
 */

// ============================================================================
// AUTH VALIDATION
// ============================================================================

export const verifyTokenSchema = z.object({
  token: z
    .string()
    .uuid('Token must be a valid UUID')
    .min(1, 'Token is required'),
})

export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>

// ============================================================================
// CODE ACTIVATION VALIDATION
// ============================================================================

export const activateCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(100, 'Code is too long')
    .regex(/^[A-Z0-9-]+$/, 'Code can only contain uppercase letters, numbers, and hyphens')
    .transform((val) => val.trim().toUpperCase()),
  user_id: z.string().uuid().optional(), // For backwards compatibility with dashboard
})

export type ActivateCodeInput = z.infer<typeof activateCodeSchema>

// ============================================================================
// PAYMENT CREATION VALIDATION
// ============================================================================

export const createPaymentSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(1, 'Minimum amount is 1')
    .max(1000000, 'Maximum amount is 1,000,000')
    .finite('Amount must be a valid number'),
  method: z.enum(['card', 'sbp', 'promo'], {
    errorMap: () => ({ message: 'Method must be card, sbp, or promo' }),
  }),
  plan_type: z.enum(['month', 'halfyear', 'year']).optional(),
  plan_name: z.string().max(100).optional(),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>

// ============================================================================
// PAYMENT WEBHOOK VALIDATION
// ============================================================================

export const paymentWebhookSchema = z.object({
  order_id: z.string().uuid('Invalid order ID'),
  status: z.string().min(1, 'Status is required'),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .pipe(z.number().positive('Amount must be positive')),
  merchant_id: z.string().optional(),
  sign: z.string().optional(),
  payment_id: z.string().optional(),
  // Allow additional fields from payment gateway
}).passthrough()

export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>

// ============================================================================
// SUBSCRIPTION CHECK VALIDATION
// ============================================================================

export const checkSubscriptionSchema = z.object({
  user_id: z.string().uuid('Invalid user ID').optional(),
  telegram_id: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
    .pipe(z.number().int('Telegram ID must be an integer').positive('Telegram ID must be positive'))
    .optional(),
})

export type CheckSubscriptionInput = z.infer<typeof checkSubscriptionSchema>

// ============================================================================
// VALIDATION HELPER
// ============================================================================

/**
 * Validate request data against a schema
 * Returns parsed data or throws ZodError
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error }
}

/**
 * Format Zod errors into user-friendly messages
 */
export function formatValidationError(error: z.ZodError): string {
  const firstError = error.errors[0]
  if (firstError) {
    return firstError.message
  }
  return 'Invalid input data'
}

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000) // Limit length
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Rate limiting helper (simple in-memory store)
 * For production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  // Clean up old entries
  if (record && record.resetTime < now) {
    rateLimitStore.delete(key)
  }

  const current = rateLimitStore.get(key)

  if (!current) {
    // First request
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }

  current.count++
  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  }
}

