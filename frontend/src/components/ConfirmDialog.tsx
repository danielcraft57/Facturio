import type { ReactNode } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import InfoIcon from '@mui/icons-material/Info'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message?: string | ReactNode
  severity?: 'info' | 'warning' | 'error' | 'success'
  confirmText?: string
  cancelText?: string
  loading?: boolean
  disabled?: boolean
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  severity = 'warning',
  confirmText,
  cancelText = 'Annuler',
  loading = false,
  disabled = false,
  maxWidth = 'sm',
  fullWidth = true,
  children,
}: ConfirmDialogProps) {
  // Texte par défaut selon la sévérité
  const getDefaultConfirmText = () => {
    switch (severity) {
      case 'error':
        return 'Supprimer'
      case 'warning':
        return 'Confirmer'
      case 'info':
        return 'Continuer'
      case 'success':
        return 'OK'
      default:
        return 'Confirmer'
    }
  }

  // Icône selon la sévérité
  const getIcon = () => {
    const iconProps = { sx: { fontSize: 40, mb: 2 } }
    
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" {...iconProps} />
      case 'warning':
        return <WarningIcon color="warning" {...iconProps} />
      case 'info':
        return <InfoIcon color="info" {...iconProps} />
      case 'success':
        return <CheckCircleIcon color="success" {...iconProps} />
      default:
        return <WarningIcon color="warning" {...iconProps} />
    }
  }

  // Couleur du bouton de confirmation
  const getConfirmButtonColor = () => {
    switch (severity) {
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'info':
        return 'primary'
      case 'success':
        return 'success'
      default:
        return 'primary'
    }
  }

  const handleConfirm = async () => {
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      // L'erreur sera gérée par le composant parent
      console.error('Erreur lors de la confirmation:', error)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      disableRestoreFocus
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getIcon()}
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {message &&
          (typeof message === 'string' ? (
            <DialogContentText component="div" sx={{ mb: 2 }}>
              {message}
            </DialogContentText>
          ) : (
            <Box component="div" sx={{ mb: 2, color: 'text.secondary' }}>
              {message}
            </Box>
          ))}

        {children}

        {severity === 'error' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Cette action est irréversible.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {cancelText}
        </Button>
        
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={getConfirmButtonColor()}
          disabled={loading || disabled}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Chargement...' : (confirmText || getDefaultConfirmText())}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Composants spécialisés pour des cas d'usage courants
export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmer la suppression',
  message = 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
  itemName,
  loading = false,
  ...props
}: Omit<ConfirmDialogProps, 'severity' | 'confirmText'> & { itemName?: string }) {
  const finalMessage = itemName 
    ? `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`
    : message

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={finalMessage}
      severity="error"
      confirmText="Supprimer"
      loading={loading}
      {...props}
    />
  )
}

export function SaveConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Sauvegarder les modifications',
  message = 'Voulez-vous sauvegarder vos modifications ?',
  loading = false,
  ...props
}: Omit<ConfirmDialogProps, 'severity' | 'confirmText'>) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      severity="info"
      confirmText="Sauvegarder"
      loading={loading}
      {...props}
    />
  )
}

export function UnsavedChangesDialog({
  open,
  onClose,
  onSave,
  onDiscard,
  loading = false,
  ...props
}: Omit<ConfirmDialogProps, 'onConfirm' | 'severity' | 'confirmText' | 'cancelText'> & {
  onSave: () => void | Promise<void>
  onDiscard: () => void
}) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onSave}
      message="Vous avez des modifications non sauvegardées. Que souhaitez-vous faire ?"
      severity="warning"
      confirmText="Sauvegarder"
      cancelText="Ignorer"
      loading={loading}
      {...props}
    >
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          onClick={() => {
            onDiscard()
            onClose()
          }}
          disabled={loading}
        >
          Ignorer les modifications
        </Button>
      </Box>
    </ConfirmDialog>
  )
}
