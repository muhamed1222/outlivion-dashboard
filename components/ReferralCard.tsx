'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from './ui/Button'

interface ReferralCardProps {
  referralLink: string
}

export function ReferralCard({ referralLink }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers or permission issues
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 pb-0">
        <CardTitle className="text-xl font-semibold text-foreground">
          Пригласите друзей и получите <span className="text-accent">50 ₽</span>
        </CardTitle>
        <p className="text-sm text-foreground-muted">
          Поделитесь персональной ссылкой. После первой покупки друга бонус автоматически поступит на ваш баланс.
        </p>
      </CardHeader>
      <CardContent className="mt-6 flex flex-col gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            Ваша ссылка
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 rounded-card border border-border bg-background px-4 py-3 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <Button
              onClick={handleCopy}
              className="shrink-0 px-6"
            >
              {copied ? 'Скопировано' : 'Скопировать'}
            </Button>
          </div>
        </div>

        <div className="rounded-card bg-accent-soft/70 px-4 py-3 text-sm text-foreground">
          <p className="font-medium text-accent">Как получить бонус?</p>
          <ul className="mt-2 space-y-1 text-foreground-muted">
            <li>1. Отправьте ссылку другу или коллеге.</li>
            <li>2. Он активирует подписку в Outlivion.</li>
            <li>3. Вы получаете 50 ₽ на баланс автоматически.</li>
          </ul>
        </div>

        <Link
          href="/referral"
          className="inline-flex items-center text-sm font-medium text-accent transition hover:text-accent-hover"
        >
          Узнать больше о программе →
        </Link>
      </CardContent>
    </Card>
  )
}
