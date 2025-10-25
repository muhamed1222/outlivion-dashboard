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
    <div className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-xl rounded-3xl p-8">
      <h2 className="text-2xl font-bold mb-4">
        Пригласи друга и получи 50₽ на баланс
      </h2>
      
      <p className="text-white/80 mb-4">
        Отправьте ссылку другу. Когда ваш друг зайдёт в наш сервис и зарегистрируется, вы получите 50₽ на баланс!
      </p>
      
      <p className="text-white/60 text-sm mb-4">
        Скопируйте и отправьте ссылку другу:
      </p>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm"
        />
        <Button
          onClick={handleCopy}
          className="bg-white/20 hover:bg-white/30 rounded-xl px-6"
        >
          {copied ? '✓' : '📋'}
        </Button>
      </div>

      <Link href="/referral" className="block text-center mt-4 text-indigo-300 hover:text-indigo-200 transition">
        Подробнее о реферальной программе →
      </Link>
    </div>
  )
}

