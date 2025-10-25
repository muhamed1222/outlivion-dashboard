'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose?: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!visible) return null

  const styles = {
    success: 'border-green-200 text-green-600 bg-green-50',
    error: 'border-rose-200 text-rose-600 bg-rose-50',
    info: 'border-blue-200 text-blue-600 bg-blue-50',
    warning: 'border-amber-200 text-amber-600 bg-amber-50',
  }

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }

  return (
    <div
      className={cn(
        'fixed top-5 right-5 z-50 flex items-center gap-3 rounded-card border px-5 py-4 shadow-soft animate-in slide-in-from-top-2',
        styles[type]
      )}
    >
      <span className="text-lg">{icons[type]}</span>
      <p className="text-sm font-medium text-foreground">{message}</p>
      <button
        onClick={() => {
          setVisible(false)
          onClose?.()
        }}
        className="ml-auto text-foreground-muted transition hover:text-foreground"
      >
        ✕
      </button>
    </div>
  )
}
