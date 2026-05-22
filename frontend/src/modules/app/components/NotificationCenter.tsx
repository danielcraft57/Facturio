import { useState } from 'react'
import {
  Badge,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Popover,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import HistoryIcon from '@mui/icons-material/History'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAppNotifications } from '../../../stores/appStore'
import type { Notification } from '../../../stores/appStore'
import { financeOutlinedButtonSx, financePrimaryButtonSx } from '../../../components/finance/financeStyles'

function formatRelativeTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function typeColor(type: Notification['type']) {
  switch (type) {
    case 'success':
      return 'success.main'
    case 'error':
      return 'error.main'
    case 'warning':
      return 'warning.main'
    default:
      return 'info.main'
  }
}

function NotificationRow({
  item,
  onRead,
  onNavigate,
}: {
  item: Notification
  onRead: (id: string) => void
  onNavigate: (href: string) => void
}) {
  const theme = useTheme()
  const handleClick = () => {
    onRead(item.id)
    if (item.href) onNavigate(item.href)
  }

  return (
    <ListItem disablePadding sx={{ opacity: item.read ? 0.72 : 1 }}>
      <ListItemButton
        onClick={handleClick}
        sx={{
          alignItems: 'flex-start',
          py: 1.35,
          borderLeft: 3,
          borderColor: typeColor(item.type),
          bgcolor: item.read ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
          '&:hover': { bgcolor: alpha('#0f172a', 0.04) },
        }}
      >
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="body2" fontWeight={item.read ? 500 : 700}>
                {item.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                {formatRelativeTime(item.timestamp)}
              </Typography>
            </Box>
          }
          secondary={
            <>
              <Typography variant="caption" color="text.secondary" component="span" display="block">
                {item.message}
              </Typography>
              {item.category && (
                <Typography
                  variant="caption"
                  sx={{ color: '#1e3a5f', fontWeight: 600, textTransform: 'capitalize' }}
                >
                  {item.category}
                </Typography>
              )}
            </>
          }
        />
      </ListItemButton>
    </ListItem>
  )
}

export function NotificationCenter() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [tab, setTab] = useState(0)
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useAppNotifications()

  const open = Boolean(anchor)
  const unread = notifications.filter((n) => !n.read)
  const history = notifications
  const listItems = tab === 0 ? unread : history

  return (
    <>
      <Tooltip title="Notifications et historique">
        <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)} aria-label="notifications">
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 'min(100vw - 24px, 380px)', sm: 400 },
              maxHeight: 520,
              mt: 1,
              borderRadius: 2.5,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: theme.shadows[12],
              border: `1px solid ${alpha('#0f172a', 0.08)}`,
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            flexShrink: 0,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            color: 'white',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Centre d&apos;activité
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est à jour'}
          </Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            flexShrink: 0,
            minHeight: 40,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 44, fontSize: '0.75rem', fontWeight: 600 },
          }}
        >
          <Tab
            icon={<NotificationsNoneIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Non lues (${unread.length})`}
          />
          <Tab
            icon={<HistoryIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Historique"
          />
        </Tabs>

        <List
          dense
          sx={{
            flex: 1,
            minHeight: 120,
            maxHeight: 340,
            overflow: 'auto',
            py: 0,
          }}
        >
          {listItems.length === 0 ? (
            <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {tab === 0 ? 'Aucune notification non lue' : 'Aucune activité enregistrée'}
              </Typography>
              {tab === 0 && history.length > 0 && (
                <Button size="small" sx={{ mt: 1, textTransform: 'none' }} onClick={() => setTab(1)}>
                  Voir l&apos;historique
                </Button>
              )}
            </Box>
          ) : (
            listItems.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onRead={markNotificationRead}
                onNavigate={(href) => {
                  setAnchor(null)
                  navigate(href)
                }}
              />
            ))
          )}
        </List>

        <Box
          sx={{
            flexShrink: 0,
            px: 1.5,
            py: 1.25,
            borderTop: 1,
            borderColor: alpha('#0f172a', 0.1),
            bgcolor: alpha('#0f172a', 0.02),
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              size="small"
              variant="contained"
              startIcon={<DoneAllIcon fontSize="small" />}
              onClick={markAllNotificationsRead}
              disabled={unreadCount === 0}
              sx={financePrimaryButtonSx}
            >
              Tout lire
            </Button>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              startIcon={<DeleteSweepIcon fontSize="small" />}
              onClick={clearNotifications}
              disabled={notifications.length === 0}
              sx={financeOutlinedButtonSx}
            >
              Effacer
            </Button>
          </Box>
          {tab === 1 && (
            <Button
              component={RouterLink}
              to="/factures"
              fullWidth
              size="small"
              variant="text"
              startIcon={<ReceiptLongIcon fontSize="small" />}
              onClick={() => setAnchor(null)}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#1e3a5f' }}
            >
              Voir les factures
            </Button>
          )}
        </Box>
      </Popover>
    </>
  )
}
