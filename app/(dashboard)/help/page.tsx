'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const faqData = [
  {
    id: 1,
    question: 'Как начать пользоваться VPN?',
    answer: 'Скачайте приложение Outlivion из App Store или Google Play, авторизуйтесь через Telegram и активируйте подписку с помощью промокода или оплаты.',
  },
  {
    id: 2,
    question: 'Как пополнить баланс?',
    answer: 'Перейдите в раздел "Пополнить", выберите нужный тариф и способ оплаты. Средства поступят на баланс автоматически после успешной оплаты.',
  },
  {
    id: 3,
    question: 'Что делать, если VPN не подключается?',
    answer: 'Проверьте интернет-соединение, убедитесь, что подписка активна, попробуйте переключиться на другой сервер. Если проблема сохраняется — обратитесь в поддержку.',
  },
  {
    id: 4,
    question: 'Как работает реферальная программа?',
    answer: 'Отправьте свою реферальную ссылку другу. После его регистрации и первой активации кода вы получите 50 ₽ на баланс.',
  },
  {
    id: 5,
    question: 'Можно ли использовать один аккаунт на нескольких устройствах?',
    answer: 'Да, вы можете использовать один аккаунт на неограниченном количестве устройств одновременно.',
  },
  {
    id: 6,
    question: 'Как отменить подписку?',
    answer: 'Автопродление происходит при наличии средств на балансе. Чтобы отменить, просто не пополняйте баланс перед датой следующего списания.',
  },
  {
    id: 7,
    question: 'Безопасно ли пользоваться VPN?',
    answer: 'Да, мы используем современные протоколы шифрования и не храним логи вашей активности. Ваши данные в полной безопасности.',
  },
  {
    id: 8,
    question: 'В каких странах работает VPN?',
    answer: 'Наши серверы расположены в более чем 50 странах мира. Вы можете подключиться к любому из них через приложение.',
  },
]

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (id: number) => {
    setOpenFaq(openFaq === id ? null : id)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Помощь и поддержка</h1>
        <p className="text-white/60">Ответы на часто задаваемые вопросы</p>
      </div>

      {/* Контакты */}
      <Card>
        <CardHeader>
          <CardTitle>Связаться с нами</CardTitle>
          <CardDescription>
            Если у вас возникли вопросы или проблемы, мы всегда готовы помочь
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href={process.env.NEXT_PUBLIC_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" className="w-full h-20">
                <div className="text-center">
                  <div className="text-2xl mb-2">💬</div>
                  <div className="font-medium">Telegram чат</div>
                  <div className="text-xs text-white/60">Ответим в течение часа</div>
                </div>
              </Button>
            </a>

            <a
              href={process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" className="w-full h-20">
                <div className="text-center">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-medium">Telegram бот</div>
                  <div className="text-xs text-white/60">Автоматические ответы 24/7</div>
                </div>
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Частые вопросы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {faqData.map((faq) => (
              <div
                key={faq.id}
                className="rounded-lg border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 text-left hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <span className="font-medium">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      openFaq === faq.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFaq === faq.id && (
                  <div className="px-4 pb-4 text-white/70">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Полезные ссылки */}
      <Card>
        <CardHeader>
          <CardTitle>Полезные ссылки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <a
              href="#"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="text-xl">📱</div>
              <div>
                <div className="font-medium">Скачать приложение</div>
                <div className="text-sm text-white/60">iOS и Android</div>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="text-xl">📚</div>
              <div>
                <div className="font-medium">База знаний</div>
                <div className="text-sm text-white/60">Подробные инструкции</div>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="text-xl">📢</div>
              <div>
                <div className="font-medium">Новости и обновления</div>
                <div className="text-sm text-white/60">Telegram канал</div>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

