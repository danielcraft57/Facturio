import { Box, Card, CardContent, Container, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { MarketingHero } from '../components/MarketingHero'
import { CtaSection } from '../components/CtaSection'
import { ScrollReveal } from '../components/ScrollReveal'
import { MarketingImage } from '../components/MarketingImage'
import { VERTICAL_SEGMENTS } from '../constants/siteContent'

const WORKFLOWS = [
  {
    title: 'Forfait site ou application',
    steps: ['Devis détaillé depuis le catalogue', 'Acompte 30 % à la commande', 'Solde à la livraison', 'PDF + lien de paiement'],
  },
  {
    title: 'Maintenance & SLA',
    steps: ['Contrat mensuel ou annuel', 'Facturation récurrente', 'Suivi des encaissements', 'Prêt pour e-reporting 2026'],
  },
  {
    title: 'Régie & intégration',
    steps: ['Lignes heures × TJM', 'Descriptions techniques sur chaque ligne', 'TVA FR ou autoliquidation UE', 'Export compta'],
  },
]

export function PrestationsPage() {
  return (
    <Box>
      <MarketingHero
        compact
        badge="Vertical métier"
        title="Facturer comme vous travaillez"
        subtitle="Facturio parle le langage des prestataires du numérique : forfaits, régie, abonnements et packs IA — pas des références stock ou grand retail."
        primaryCta={{ label: 'Essayer gratuitement', to: '/signup' }}
        secondaryCta={{ label: 'Voir les tarifs', to: '/tarifs' }}
        visual={<MarketingImage src="/images/facturio-prestations.png" alt="Prestations dev et automatisation" float={false} />}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <ScrollReveal>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 4, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Segments couverts
          </Typography>
        </ScrollReveal>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 8 }}>
          {VERTICAL_SEGMENTS.map((seg, i) => (
            <ScrollReveal key={seg.title} delayMs={i * 70}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {seg.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {seg.description}
                  </Typography>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 5,
            mb: 8,
          }}
        >
          <ScrollReveal>
            <MarketingImage src="/images/facturio-workflow.png" alt="Workflow facturation prestations" maxWidth={420} />
          </ScrollReveal>
          <Box sx={{ flex: 1 }}>
            <ScrollReveal delayMs={80}>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 4, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                Parcours types
              </Typography>
            </ScrollReveal>
            <Box sx={{ display: 'grid', gap: 2 }}>
              {WORKFLOWS.map((w, i) => (
                <ScrollReveal key={w.title} delayMs={100 + i * 60}>
                  <Card sx={{ bgcolor: 'background.default' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {w.title}
                      </Typography>
                      <List dense disablePadding>
                        {w.steps.map((step) => (
                          <ListItem key={step} disableGutters sx={{ py: 0.35 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircleOutlineIcon color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={step} primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </Box>
          </Box>
        </Box>

        <ScrollReveal>
          <Box sx={{ p: 4, borderRadius: 3, bgcolor: 'action.hover' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Catalogue DanielCraft intégré
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Le seed de démonstration reprend les offres du site danielcraft.fr. Chaque organisation pourra
              personnaliser sa bibliothèque tout en gardant la structure adaptée à la facturation électronique.
            </Typography>
          </Box>
        </ScrollReveal>
      </Container>

      <CtaSection
        title="Votre activité rentre dans ces cases ?"
        subtitle="Freelance dev, intégrateur, petite agence ou consultant automatisation : Facturio est fait pour vous."
      />
    </Box>
  )
}
