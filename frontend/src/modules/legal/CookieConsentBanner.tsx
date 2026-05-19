import { useEffect, useState } from 'react'
import { Alert, Box, Button, Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { COOKIE_NOTICE } from './content'

const STORAGE_KEY = 'facturio_cookie_consent_v1'

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    } catch {
      /* ignore */
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1400,
        p: 2,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        boxShadow: 8,
      }}
    >
      <Alert
        severity="info"
        sx={{ maxWidth: 960, mx: 'auto', alignItems: 'flex-start' }}
        action={
          <Button color="inherit" size="small" onClick={accept} sx={{ whiteSpace: 'nowrap' }}>
            J&apos;accepte
          </Button>
        }
      >
        <Typography variant="body2" component="span">
          {COOKIE_NOTICE}{' '}
          <Link component={RouterLink} to="/privacy" underline="hover">
            Politique de confidentialité
          </Link>
        </Typography>
      </Alert>
    </Box>
  )
}
