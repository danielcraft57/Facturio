import { Box, Card, CardContent, Container, Typography } from '@mui/material'
import CodeIcon from '@mui/icons-material/Code'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import PublicIcon from '@mui/icons-material/Public'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import type { ReactNode } from 'react'

const ICONS: ReactNode[] = [
  <Inventory2Icon sx={{ fontSize: 40 }} />,
  <RequestQuoteIcon sx={{ fontSize: 40 }} />,
  <PublicIcon sx={{ fontSize: 40 }} />,
  <AccountBalanceIcon sx={{ fontSize: 40 }} />,
  <CodeIcon sx={{ fontSize: 40 }} />,
  <VerifiedUserIcon sx={{ fontSize: 40 }} />,
]

type FeatureItem = { title: string; description: string }

type FeatureGridProps = {
  title?: string | null
  subtitle?: string
  features: readonly FeatureItem[]
}

export function FeatureGrid({
  title = 'Fonctionnalités',
  subtitle,
  features,
}: FeatureGridProps) {
  return (
    <Box sx={{ py: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg">
        {(title != null && title !== '') || subtitle ? (
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            {title != null && title !== '' && (
              <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 700, mb: 1.5 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', fontWeight: 400 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        ) : null}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              variant="outlined"
              sx={{
                height: '100%',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>{ICONS[index % ICONS.length]}</Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
