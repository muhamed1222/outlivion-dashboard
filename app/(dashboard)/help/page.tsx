'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const faqData = [
  {
    id: 1,
    question: 'Как начать пользоваться VPN?',
    answer:
      'Скачайте приложение Outlivion из App Store или Google Play, авторизуйтесь через Telegram и активируйте подписку с помощью промокода или оплаты.',
  },
  {
    id: 2,
    question: 'Как пополнить баланс?',
    answer:
      'Перейдите в раздел «Пополнить», выберите тариф и способ оплаты. Средства поступят на баланс сразу после успешной транзакции.',
  },
  {
    id: 3,
    question: 'Что делать, если VPN не подключается?',
    answer:
      'Проверьте интернет-соединение, убедитесь, что подписка активна, попробуйте другой сервер. Если проблема сохраняется — напишите в поддержку.',
  },
  {
    id: 4,
    question: 'Как работает реферальная программа?',
    answer:
      'Поделитесь персональной ссылкой. После первой активации кода приглашённого пользователя вы получите 50 ₽ на баланс.',
  },
  {
    id: 5,
    question: 'Можно ли использовать один аккаунт на нескольких устройствах?',
    answer: 'Да, один аккаунт можно подключать к нескольким устройствам одновременно.',
  },
  {
    id: 6,
    question: 'Как отменить подписку?',
    answer:
      'Автопродление происходит при наличии средств на балансе. Достаточно не пополнять баланс перед датой списания.',
  },
  {
    id: 7,
    question: 'Безопасно ли пользоваться VPN?',
    answer:
      'Мы применяем современные протоколы шифрования и не сохраняем логи активности. Ваши данные под надёжной защитой.',
  },
  {
    id: 8,
    question: 'В каких странах работает VPN?',
    answer:
      'Сервера расположены более чем в 50 странах мира — вы сможете подключиться к нужной локации за пару кликов.',
  },
]

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (id: number) => {
    setOpenFaq((prev) => (prev === id ? null : id))
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Помощь и поддержка</h1>
        <p className="text-foreground-muted">Найдите ответ или быстро свяжитесь с нашей командой</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Связаться с нами</CardTitle>
          <CardDescription>Отвечаем оперативно и помогаем в решении любых вопросов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <a href={process.env.NEXT_PUBLIC_SUPPORT_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="h-20 w-full justify-start px-5">
                <div className="flex w-full items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5h16a1.5 1.5 0 011.5 1.5v10a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 17V7A1.5 1.5 0 014 5.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l8 4 8-4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Telegram чат</p>
                    <p className="text-xs text-foreground-muted">Ответим в течение часа</p>
                  </div>
                </div>
              </Button>
            </a>
            <a href={process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="h-20 w-full justify-start px-5">
                <div className="flex w-full items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5l9 8-3.3 1.2a1 1 0 00-.6.6L15 20l-3-2-3 2 1-5.7a1 1 0 00-.4-.9L3 10.5l9-8z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Telegram бот</p>
                    <p className="text-xs text-foreground-muted">Автоматические ответы 24/7</p>
                  </div>
                </div>
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Частые вопросы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqData.map((faq) => (
            <div key={faq.id} className="rounded-card border border-border bg-background">
              <button
                onClick={() => toggleFaq(faq.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-accent-soft/60"
              >
                <span className="text-sm font-semibold text-foreground">{faq.question}</span>
                <svg
                  className={`h-4 w-4 text-foreground-subtle transition-transform ${openFaq === faq.id ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 9.5L12 15l5.5-5.5" />
                </svg>
              </button>
              {openFaq === faq.id && (
                <div className="px-4 pb-4 text-sm text-foreground-muted">{faq.answer}</div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Полезные ссылки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              href: '#',
              title: 'Скачать приложение',
              description: 'Доступно для iOS и Android',
              icon: (
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.5H8A2.5 2.5 0 005.5 6v12A2.5 2.5 0 008 20.5h8a2.5 2.5 0 002.5-2.5V6A2.5 2.5 0 0016 3.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 6.5h5" />
                </svg>
              ),
            },
            {
              href: '#',
              title: 'База знаний',
              description: 'Пошаговые инструкции и советы',
              icon: (
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 4.5h12a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 18V6A1.5 1.5 0 016 4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 8h8M8 12h8M8 16h5" />
                </svg>
              ),
            },
            {
              href: '#',
              title: 'Новости и обновления',
              description: 'Актуальная информация в Telegram-канале',
              icon: (
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5l16-2v17l-16-2V5.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 9l5 3-5 3V9z" />
                </svg>
              ),
            },
          ].map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="flex items-center gap-3 rounded-card border border-border bg-background px-4 py-3 transition hover:border-accent-soft hover:text-accent"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-foreground-muted">{item.description}</p>
              </div>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
