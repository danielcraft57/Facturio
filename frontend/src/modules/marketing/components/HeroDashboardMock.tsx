import { Box, Chip, Paper, Typography, alpha } from '@mui/material'
import { keyframes } from '@mui/system'

const pulse = keyframes`
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
`

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
`

/** Maquette animée du tableau de bord (CSS pur, sans image). */
export function HeroDashboardMock() {
  return (
    <Paper
      elevation={8}
      sx={{
        p: 2.5,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        maxWidth: 420,
        mx: 'auto',
        animation: `${slideIn} 0.8s ease-out 0.2s both`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} color="primary.main">
          PrestaFacture
        </Typography>
        <Chip label="Pro" size="small" color="primary" variant="outlined" />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 2 }}>
        {[
          { label: 'CA du mois', value: '4 280 €' },
          { label: 'Factures', value: '12' },
          { label: 'Devis en attente', value: '3' },
          { label: 'Encaissements', value: '89 %' },
        ].map((stat, i) => (
          <Box
            key={stat.label}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
              animation: `${pulse} 3s ease-in-out ${i * 0.4}s infinite`,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {stat.label}
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
        Dernières factures
      </Typography>
      {['Maintenance site — 290 €', 'Campagne réseaux — 1 840 €', 'Identité visuelle — 490 €'].map((line, i) => (
        <Box
          key={line}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            py: 0.75,
            borderBottom: i < 2 ? 1 : 0,
            borderColor: 'divider',
            animation: `${slideIn} 0.5s ease-out ${0.4 + i * 0.15}s both`,
          }}
        >
          <Typography variant="body2">{line}</Typography>
          <Chip label="Envoyée" size="small" color="success" variant="outlined" sx={{ height: 22 }} />
        </Box>
      ))}
    </Paper>
  )
}
