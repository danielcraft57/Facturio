import { useState } from 'react'
import type { ReactNode } from 'react'

export type ToastSeverity = 'success' | 'info' | 'warning' | 'error'

export interface ToastMessage {
  id: string
  message: string
  title?: string
  severity: ToastSeverity
  duration?: number
  action?: ReactNode
  closable?: boolean
  autoHide?: boolean
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastMessage = {
      id,
      autoHide: true,
      closable: true,
      duration: 9500,
      ...message,
    }

    setToasts((prev) => [...prev, newToast])
    return id
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const clearToasts = () => {
    setToasts([])
  }

  const success = (message: string, options?: Partial<ToastMessage>) => {
    return addToast({ message, severity: 'success', ...options })
  }

  const info = (message: string, options?: Partial<ToastMessage>) => {
    return addToast({ message, severity: 'info', ...options })
  }

  const warning = (message: string, options?: Partial<ToastMessage>) => {
    return addToast({ message, severity: 'warning', ...options })
  }

  const error = (message: string, options?: Partial<ToastMessage>) => {
    return addToast({ message, severity: 'error', ...options })
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    info,
    warning,
    error,
  }
}
