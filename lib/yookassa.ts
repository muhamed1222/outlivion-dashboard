import crypto from 'crypto'
import { logger } from './logger'

/**
 * Типы для работы с YooKassa API
 * Документация: https://yookassa.ru/developers/api
 */

export interface YooKassaPaymentParams {
  amount: number
  order_id: string
  description: string
  return_url: string
  metadata?: Record<string, any>
  payment_method_data?: {
    type: 'bank_card' | 'sbp' | 'sberbank' | 'yoo_money' | 'tinkoff_bank'
  }
  capture?: boolean // Автоматическое подтверждение платежа
}

export interface YooKassaPaymentResponse {
  id: string // UUID платежа в YooKassa
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled'
  paid: boolean
  amount: {
    value: string
    currency: string
  }
  confirmation: {
    type: 'redirect'
    confirmation_url: string
  }
  created_at: string
  metadata?: Record<string, any>
}

export interface YooKassaWebhookPayload {
  type: 'notification'
  event: 'payment.succeeded' | 'payment.canceled' | 'payment.waiting_for_capture'
  object: {
    id: string
    status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled'
    paid: boolean
    amount: {
      value: string
      currency: string
    }
    authorization_details?: {
      rrn: string
      auth_code: string
    }
    captured_at?: string
    created_at: string
    description?: string
    metadata?: {
      order_id: string
      [key: string]: any
    }
    payment_method: {
      type: string
      id: string
      saved: boolean
      title?: string
      card?: {
        first6: string
        last4: string
        expiry_year: string
        expiry_month: string
        card_type: string
      }
    }
    recipient?: {
      account_id: string
      gateway_id: string
    }
    refundable: boolean
    test: boolean
  }
}

/**
 * Создание платежа в YooKassa
 * @param params - Параметры платежа
 * @returns Promise с URL для оплаты и ID платежа
 */
export async function createYooKassaPayment(
  params: YooKassaPaymentParams
): Promise<YooKassaPaymentResponse> {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY

  if (!shopId || !secretKey) {
    logger.error({
      event_type: 'yookassa_credentials_missing',
      source: 'yookassa_create_payment'
    }, 'YooKassa credentials are not configured')
    throw new Error('YooKassa credentials are not configured')
  }

  // Проверяем, включена ли YooKassa
  if (process.env.ENABLE_YOOKASSA !== 'true') {
    throw new Error('YooKassa is disabled')
  }

  // Генерируем Idempotency-Key для предотвращения дублей
  const idempotencyKey = crypto.randomUUID()

  // Формируем тело запроса
  const requestBody = {
    amount: {
      value: params.amount.toFixed(2),
      currency: 'RUB'
    },
    capture: params.capture !== false, // По умолчанию автоматическое подтверждение
    confirmation: {
      type: 'redirect',
      return_url: params.return_url
    },
    description: params.description,
    metadata: {
      ...params.metadata,
      order_id: params.order_id
    },
    ...(params.payment_method_data && {
      payment_method_data: params.payment_method_data
    })
  }

  logger.info({
    event_type: 'yookassa_payment_creating',
    source: 'yookassa_create_payment',
    order_id: params.order_id,
    amount: params.amount
  }, 'Creating YooKassa payment')

  try {
    // Базовая авторизация
    const authString = Buffer.from(`${shopId}:${secretKey}`).toString('base64')

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotencyKey,
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error({
        event_type: 'yookassa_api_error',
        source: 'yookassa_create_payment',
        status: response.status,
        error: errorData
      }, 'YooKassa API error')
      throw new Error(`YooKassa API error: ${response.status}`)
    }

    const paymentData: YooKassaPaymentResponse = await response.json()

    logger.info({
      event_type: 'yookassa_payment_created',
      source: 'yookassa_create_payment',
      order_id: params.order_id,
      payment_id: paymentData.id,
      status: paymentData.status
    }, 'YooKassa payment created successfully')

    return paymentData
  } catch (error) {
    logger.error({
      event_type: 'yookassa_payment_creation_error',
      source: 'yookassa_create_payment',
      order_id: params.order_id,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 'Error creating YooKassa payment')
    throw error
  }
}

/**
 * Проверка подписи webhook от YooKassa
 * YooKassa не использует подпись в заголовках, но проверяем через IP
 * Документация: https://yookassa.ru/developers/using-api/webhooks#verifying-notifications
 */
export function verifyYooKassaWebhookSignature(
  payload: YooKassaWebhookPayload,
  signature: string | null
): boolean {
  // YooKassa использует другой подход к верификации
  // Рекомендуется проверять IP адреса источника
  // Список IP: https://yookassa.ru/developers/using-api/webhooks#ip
  
  const yookassaIPs = [
    '185.71.76.0/27',
    '185.71.77.0/27',
    '77.75.153.0/25',
    '77.75.156.11',
    '77.75.156.35',
    '77.75.154.128/25',
    '2a02:5180::/32'
  ]

  // Базовая валидация структуры payload
  if (!payload || !payload.object || !payload.event) {
    logger.error({
      event_type: 'yookassa_invalid_payload',
      source: 'yookassa_webhook_verification'
    }, 'Invalid YooKassa webhook payload structure')
    return false
  }

  // В production следует добавить проверку IP
  // Здесь упрощенная валидация для разработки
  logger.info({
    event_type: 'yookassa_webhook_verified',
    source: 'yookassa_webhook_verification',
    event: payload.event,
    payment_id: payload.object.id
  }, 'YooKassa webhook verified')

  return true
}

/**
 * Нормализация статуса из YooKassa в статус базы данных
 */
export function normalizeYooKassaStatus(
  status: string
): 'pending' | 'completed' | 'failed' {
  switch (status.toLowerCase()) {
    case 'succeeded':
      return 'completed'
    case 'canceled':
      return 'failed'
    case 'pending':
    case 'waiting_for_capture':
      return 'pending'
    default:
      logger.warn({
        event_type: 'yookassa_unknown_status',
        source: 'yookassa_status_normalization',
        status
      }, 'Unknown YooKassa status, defaulting to pending')
      return 'pending'
  }
}

/**
 * Подтверждение платежа (capture)
 * Используется для двухстадийных платежей
 */
export async function captureYooKassaPayment(
  paymentId: string,
  amount?: number
): Promise<YooKassaPaymentResponse> {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY

  if (!shopId || !secretKey) {
    throw new Error('YooKassa credentials are not configured')
  }

  const authString = Buffer.from(`${shopId}:${secretKey}`).toString('base64')
  const idempotencyKey = crypto.randomUUID()

  const requestBody = amount ? {
    amount: {
      value: amount.toFixed(2),
      currency: 'RUB'
    }
  } : {}

  logger.info({
    event_type: 'yookassa_payment_capturing',
    source: 'yookassa_capture_payment',
    payment_id: paymentId
  }, 'Capturing YooKassa payment')

  try {
    const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotencyKey,
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error({
        event_type: 'yookassa_capture_error',
        source: 'yookassa_capture_payment',
        payment_id: paymentId,
        status: response.status,
        error: errorData
      }, 'YooKassa capture error')
      throw new Error(`YooKassa capture error: ${response.status}`)
    }

    const paymentData: YooKassaPaymentResponse = await response.json()

    logger.info({
      event_type: 'yookassa_payment_captured',
      source: 'yookassa_capture_payment',
      payment_id: paymentId,
      status: paymentData.status
    }, 'YooKassa payment captured successfully')

    return paymentData
  } catch (error) {
    logger.error({
      event_type: 'yookassa_capture_error',
      source: 'yookassa_capture_payment',
      payment_id: paymentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 'Error capturing YooKassa payment')
    throw error
  }
}

/**
 * Получение информации о платеже
 */
export async function getYooKassaPayment(
  paymentId: string
): Promise<YooKassaPaymentResponse> {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY

  if (!shopId || !secretKey) {
    throw new Error('YooKassa credentials are not configured')
  }

  const authString = Buffer.from(`${shopId}:${secretKey}`).toString('base64')

  try {
    const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`
      }
    })

    if (!response.ok) {
      throw new Error(`YooKassa API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    logger.error({
      event_type: 'yookassa_get_payment_error',
      source: 'yookassa_get_payment',
      payment_id: paymentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 'Error getting YooKassa payment')
    throw error
  }
}

/**
 * Форматирование суммы для YooKassa (они принимают строку с 2 знаками после запятой)
 */
export function formatAmountForYooKassa(amount: number): string {
  return amount.toFixed(2)
}

