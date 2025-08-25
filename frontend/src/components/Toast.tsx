import type { ReactNode } from 'react'
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useState, useEffect } from 'react'

// Types pour les notifications
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

export interface ToastProps {
  message: ToastMessage
  onClose: (id: string) => void
}

// Hook pour gérer les toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastMessage = {
      id,
      autoHide: true,
      closable: true,
      duration: 6000,
      ...message,
    }
    
    setToasts(prev => [...prev, newToast])
    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearToasts = () => {
    setToasts([])
  }

  // Méthodes de convenance
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

// Composant Toast individuel
export function Toast({ message, onClose }: ToastProps) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (message.autoHide && message.duration) {
      const timer = setTimeout(() => {
        handleClose()
      }, message.duration)

      return () => clearTimeout(timer)
    }
  }, [message.autoHide, message.duration])

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      onClose(message.id)
    }, 300) // Délai pour l'animation
  }

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 8 }} // Espace pour l'AppBar
    >
      <Alert
        severity={message.severity}
        onClose={message.closable ? handleClose : undefined}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {message.action}
            {message.closable && (
              <IconButton
                size="small"
                color="inherit"
                onClick={handleClose}
                sx={{ ml: 1 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        }
        sx={{
          width: '100%',
          minWidth: 300,
          maxWidth: 400,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <Box>
          {message.title && (
            <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
              {message.title}
            </AlertTitle>
          )}
          
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {message.message}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  )
}

// Composant ToastContainer pour afficher tous les toasts
export function ToastContainer({ toasts, onClose }: { toasts: ToastMessage[]; onClose: (id: string) => void }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 2,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast, index) => (
        <Box
          key={toast.id}
          sx={{
            pointerEvents: 'auto',
            transform: `translateY(${index * 80}px)`,
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <Toast message={toast} onClose={onClose} />
        </Box>
      ))}
    </Box>
  )
}

// Composant pour les notifications persistantes (non-auto-hide)
export function PersistentToast({ message, onClose }: ToastProps) {
  const [open, setOpen] = useState(true)

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      onClose(message.id)
    }, 300)
  }

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: 2 }}
    >
      <Alert
        severity={message.severity}
        onClose={handleClose}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {message.action}
            <IconButton
              size="small"
              color="inherit"
              onClick={handleClose}
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
        sx={{
          width: '100%',
          minWidth: 400,
          maxWidth: 600,
        }}
      >
        <Box>
          {message.title && (
            <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
              {message.title}
            </AlertTitle>
          )}
          
          <Typography variant="body2">
            {message.message}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  )
}

// Exemple d'utilisation dans un composant
export function ToastExample() {
  const toast = useToast()

  const showSuccess = () => {
    toast.success('Opération réussie !')
  }

  const showError = () => {
    toast.error('Une erreur est survenue', {
      title: 'Erreur',
      duration: 10000, // 10 secondes
    })
  }

  const showWarning = () => {
    toast.warning('Attention, cette action est irréversible', {
      title: 'Avertissement',
      action: (
        <IconButton size="small" color="inherit">
          <CloseIcon fontSize="small" />
        </IconButton>
      ),
    })
  }

  const showInfo = () => {
    toast.info('Information importante', {
      title: 'Info',
      autoHide: false, // Ne se ferme pas automatiquement
    })
  }

  return (
    <Box>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      
      {/* Boutons d'exemple */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <button onClick={showSuccess}>Success</button>
        <button onClick={showError}>Error</button>
        <button onClick={showWarning}>Warning</button>
        <button onClick={showInfo}>Info</button>
      </Box>
    </Box>
  )
}
