import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
} from '@mui/material'
import { useState, useEffect, useCallback } from 'react'
import type { ToastMessage } from './toastContext'

export type { ToastMessage, ToastSeverity } from './toastContext'

export interface ToastProps {
  message: ToastMessage
  onClose: (id: string) => void
}

// Composant Toast individuel
export function Toast({ message, onClose }: ToastProps) {
  const [open, setOpen] = useState(true)

  const handleClose = useCallback(() => {
    setOpen(false)
    setTimeout(() => {
      onClose(message.id)
    }, 300) // Délai pour l'animation
  }, [message.id, onClose])

  useEffect(() => {
    if (message.autoHide && message.duration) {
      const timer = setTimeout(() => {
        handleClose()
      }, message.duration)

      return () => clearTimeout(timer)
    }
  }, [message.autoHide, message.duration, handleClose])

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

