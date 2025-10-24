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
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
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
        'fixed top-4 right-4 z-50 p-4 rounded-lg border backdrop-blur-sm animate-in slide-in-from-top-2',
        styles[type]
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icons[type]}</span>
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setVisible(false)
            onClose?.()
          }}
          className="ml-4 hover:opacity-70"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

