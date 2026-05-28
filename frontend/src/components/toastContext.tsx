import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ToastContainer } from './Toast'

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

export type ToastApi = {
  toasts: ToastMessage[]
  addToast: (message: Omit<ToastMessage, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
  success: (message: string, options?: Partial<ToastMessage>) => string
  info: (message: string, options?: Partial<ToastMessage>) => string
  warning: (message: string, options?: Partial<ToastMessage>) => string
  error: (message: string, options?: Partial<ToastMessage>) => string
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  const addToast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 11)
    const newToast: ToastMessage = {
      id,
      autoHide: true,
      closable: true,
      duration: 9500,
      ...message,
    }
    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const success = useCallback(
    (message: string, options?: Partial<ToastMessage>) =>
      addToast({ message, severity: 'success', ...options }),
    [addToast],
  )

  const info = useCallback(
    (message: string, options?: Partial<ToastMessage>) =>
      addToast({ message, severity: 'info', ...options }),
    [addToast],
  )

  const warning = useCallback(
    (message: string, options?: Partial<ToastMessage>) =>
      addToast({ message, severity: 'warning', ...options }),
    [addToast],
  )

  const error = useCallback(
    (message: string, options?: Partial<ToastMessage>) =>
      addToast({ message, severity: 'error', ...options }),
    [addToast],
  )

  const value = useMemo<ToastApi>(
    () => ({
      toasts,
      addToast,
      removeToast,
      clearToasts,
      success,
      info,
      warning,
      error,
    }),
    [toasts, addToast, removeToast, clearToasts, success, info, warning, error],
  )

  if (typeof window !== 'undefined') {
    ;(window as Window & { toast?: ToastApi }).toast = value
  }

  return (
    <ToastContext.Provider value={value}>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {children}
    </ToastContext.Provider>
  )
}

/** Notifications globales — doit être sous {@link ToastProvider}. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast doit être utilisé dans un ToastProvider')
  }
  return ctx
}
