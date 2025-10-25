'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from './ui/Button'

interface ReferralCardProps {
  referralLink: string
}

export function ReferralCard({ referralLink }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-850 border border-gray-800 rounded-3xl p-6 shadow-xl">
      <h2 className="text-xl font-bold mb-3 text-white">
        🎁 Пригласи друга и получи <span className="text-accent">50₽</span>
      </h2>
      
      <p className="text-gray-400 mb-4 text-sm leading-relaxed">
        Отправьте ссылку другу. Когда ваш друг зайдёт в наш сервис и зарегистрируется, вы получите 50₽ на баланс!
      </p>
      
      <p className="text-gray-500 text-xs mb-3">
        Скопируйте и отправьте ссылку другу:
      </p>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300 focus:border-accent focus:outline-none"
        />
        <Button
          onClick={handleCopy}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl px-6 transition-all"
        >
          {copied ? '✓' : '📋'}
        </Button>
      </div>

      <Link href="/referral" className="block text-center text-sm text-accent hover:text-accent-hover transition">
        Подробнее о реферальной программе →
      </Link>
    </div>
  )
}

