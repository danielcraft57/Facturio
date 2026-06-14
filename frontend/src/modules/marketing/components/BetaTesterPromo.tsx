import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  LinearProgress,
  Stack,
  Typography,
  alpha,
} from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import CheckIcon from '@mui/icons-material/Check'
import { Link as RouterLink } from 'react-router-dom'
import { BETA_PROGRAM, CTA } from '../constants/siteContent'
import { GA_EVENTS, trackMarketingCtaClick } from '../../../config/analyticsEvents'
import { ScrollReveal } from './ScrollReveal'
import { billingService, type BetaProgramStats } from '../../../services/billing'
import { unwrapApiPayload } from '../../../services/clients'

type BetaTesterPromoProps = {
  /** Variante compacte pour pages secondaires */
  compact?: boolean
}

/**
 * Bandeau programme beta testeurs avec stats temps réel (places restantes).
 */
export function BetaTesterPromo({ compact = false }: BetaTesterPromoProps) {
  const [stats, setStats] = useState<BetaProgramStats | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await billingService.getBetaProgramStats()
        if (!cancelled) setStats(unwrapApiPayload<BetaProgramStats>(res))
      } catch {
        if (!cancelled) setStats(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const remaining = stats?.remainingSlots
  const maxSlots = stats?.maxSlots ?? 0
  const progress =
    maxSlots > 0 && remaining != null ? Math.min(100, ((maxSlots - remaining) / maxSlots) * 100) : null
  const publicCodes = stats?.campaignCodes?.slice(0, 4) ?? []

  return (
    <Box sx={{ py: compact ? { xs: 3, md: 4 } : { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <ScrollReveal>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: 1,
              borderColor: (t) => alpha(t.palette.secondary.main, 0.35),
              background: (t) =>
                `linear-gradient(135deg, ${alpha(t.palette.secondary.main, 0.12)} 0%, ${alpha(t.palette.primary.main, 0.08)} 100%)`,
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: compact ? 3 : 4 } }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={3}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                justifyContent="space-between"
              >
                <Box sx={{ flex: 1 }}>
                  <Chip
                    icon={<RocketLaunchIcon />}
                    label={BETA_PROGRAM.badge}
                    color="secondary"
                    size="small"
                    sx={{ mb: 1.5, fontWeight: 600 }}
                  />
                  <Typography variant={compact ? 'h6' : 'h5'} fontWeight={700} gutterBottom>
                    {BETA_PROGRAM.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 640 }}>
                    {BETA_PROGRAM.description}
                  </Typography>

                  {stats && (
                    <Box sx={{ mb: compact ? 1 : 2, maxWidth: 420 }}>
                      {stats.programOpen && remaining != null ? (
                        <>
                          <Typography variant="body2" fontWeight={600} gutterBottom>
                            {remaining > 0
                              ? `Il reste ${remaining} place${remaining > 1 ? 's' : ''} sur ${maxSlots}`
                              : 'Programme complet pour le moment'}
                          </Typography>
                          {progress != null && (
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              color="secondary"
                              sx={{ height: 8, borderRadius: 4, mb: 1 }}
                            />
                          )}
                        </>
                      ) : (
                        <Typography variant="body2" color="warning.main" fontWeight={600}>
                          Inscriptions beta closes pour le moment.
                        </Typography>
                      )}
                      {publicCodes.length > 0 && (
                        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1 }}>
                          {publicCodes.map((c) => (
                            <Chip
                              key={c.code}
                              label={c.code}
                              size="small"
                              variant="outlined"
                              component={RouterLink}
                              to={`/signup?beta=${encodeURIComponent(c.code)}`}
                              clickable
                              onClick={() =>
                                trackMarketingCtaClick({
                                  event: GA_EVENTS.CTA_BETA_CODE,
                                  label: c.code,
                                  destination: `/signup?beta=${c.code}`,
                                  section: 'beta_banner',
                                })
                              }
                            />
                          ))}
                        </Stack>
                      )}
                    </Box>
                  )}

                  {!compact && (
                    <Stack component="ul" spacing={0.75} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                      {BETA_PROGRAM.steps.map((step) => (
                        <Box
                          component="li"
                          key={step}
                          sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                        >
                          <CheckIcon color="secondary" sx={{ fontSize: 18, mt: 0.25 }} />
                          <Typography variant="body2" color="text.secondary">
                            {step}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
                <Stack spacing={1} sx={{ minWidth: { md: 220 }, width: { xs: '100%', md: 'auto' } }}>
                  <Button
                    component={RouterLink}
                    to={CTA.betaSignup.to}
                    variant="contained"
                    color="secondary"
                    size="large"
                    fullWidth
                    disabled={stats != null && stats.programOpen === false}
                    onClick={() =>
                      trackMarketingCtaClick({
                        event: CTA.betaSignup.gaEvent ?? GA_EVENTS.CTA_BETA,
                        label: CTA.betaSignup.label,
                        destination: CTA.betaSignup.to,
                        section: 'beta_banner',
                      })
                    }
                  >
                    {CTA.betaSignup.label}
                  </Button>
                  <Button
                    component={RouterLink}
                    to={CTA.signupFree.to}
                    variant="outlined"
                    fullWidth
                    onClick={() =>
                      trackMarketingCtaClick({
                        event: CTA.signupFree.gaEvent ?? GA_EVENTS.CTA_SIGNUP,
                        label: CTA.signupFree.label,
                        destination: CTA.signupFree.to,
                        section: 'beta_banner',
                      })
                    }
                  >
                    {CTA.signupFree.label}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </ScrollReveal>
      </Container>
    </Box>
  )
}
