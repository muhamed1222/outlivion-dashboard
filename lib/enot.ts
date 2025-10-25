import crypto from 'crypto'

/**
 * Типы для работы с Enot.io API
 */

export interface EnotPaymentParams {
  amount: number
  order_id: string
  currency?: string
  comment?: string
  success_url?: string
  fail_url?: string
  email?: string
}

export interface EnotPaymentResponse {
  url: string
  id: string
}

export interface EnotWebhookPayload {
  merchant: string
  merchant_id: string
  amount: string
  order_id: string
  currency: string
  profit: string
  commission: string
  commission_client: string
  custom_fields?: string
  payment_id: string
  payment_system: string
  status: 'success' | 'fail' | 'expired' | 'rejected'
  type: string
  credited: string
  sign: string
}

/**
 * Создание платежа в Enot.io
 * Документация: https://enot.io/docs
 */
export async function createEnotPayment(
  params: EnotPaymentParams
): Promise<EnotPaymentResponse> {
  const shopId = process.env.ENOT_SHOP_ID
  const secretKey = process.env.ENOT_SECRET_KEY

  if (!shopId || !secretKey) {
    throw new Error('Enot.io credentials are not configured')
  }

  // Формируем параметры для Enot.io
  const paymentData = {
    merchant: shopId,
    amount: params.amount.toString(),
    order_id: params.order_id,
    currency: params.currency || 'RUB',
    comment: params.comment || '',
    success_url: params.success_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    fail_url: params.fail_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail`,
  }

  // Создаем подпись для запроса
  const signString = `${shopId}:${paymentData.amount}:${secretKey}:${paymentData.order_id}`
  const sign = crypto.createHash('md5').update(signString).digest('hex')

  // Формируем URL для редиректа (Enot.io использует GET редирект)
  const params_str = new URLSearchParams({
    ...paymentData,
    sign,
  }).toString()

  const paymentUrl = `https://enot.io/pay?${params_str}`

  return {
    url: paymentUrl,
    id: params.order_id,
  }
}

/**
 * Проверка подписи webhook от Enot.io
 * Документация: https://enot.io/docs/webhook
 */
export function verifyEnotWebhookSignature(
  payload: EnotWebhookPayload
): boolean {
  const secretKey2 = process.env.ENOT_SECRET_KEY_2

  if (!secretKey2) {
    console.error('ENOT_SECRET_KEY_2 is not configured')
    return false
  }

  try {
    // Формируем строку для проверки подписи
    // Формат: merchant_id:amount:secret_key_2:order_id
    const signString = `${payload.merchant_id}:${payload.amount}:${secretKey2}:${payload.order_id}`
    
    // Вычисляем MD5 хеш
    const expectedSign = crypto
      .createHash('md5')
      .update(signString)
      .digest('hex')

    // Сравниваем подписи
    return expectedSign === payload.sign
  } catch (error) {
    console.error('Error verifying Enot.io webhook signature:', error)
    return false
  }
}

/**
 * Нормализация статуса из Enot.io в статус базы данных
 */
export function normalizeEnotStatus(
  status: string
): 'pending' | 'completed' | 'failed' {
  switch (status.toLowerCase()) {
    case 'success':
      return 'completed'
    case 'fail':
    case 'failed':
    case 'expired':
    case 'rejected':
      return 'failed'
    default:
      return 'pending'
  }
}

/**
 * Форматирование суммы для Enot.io (они принимают в рублях с копейками)
 */
export function formatAmountForEnot(amount: number): number {
  return Math.round(amount * 100) / 100
}

