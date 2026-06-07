import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes as RouterRoutes, useParams } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline, CircularProgress, Box } from '@mui/material'
import { useState, useEffect, lazy, Suspense } from 'react'
import { createCustomTheme, type ThemeSettings } from '../../theme/theme'
import { AppLayout } from './components/AppLayout'
import { PublicLayout } from './components/PublicLayout'
import { ThemeSettingsDrawer } from './components/ThemeSettingsDrawer'
import { ToastProvider } from '../../components/useToast'
import { TopRouteProgress } from '../../components/TopRouteProgress'
import { DocumentFolderRouteFallback } from '../../components/loading/DocumentFolderRouteFallback'
import { ProductCatalogRouteFallback } from '../../components/loading/ProductCatalogRouteFallback'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { FinanceRealtimeBridge } from '../../components/FinanceRealtimeBridge'
const LandingPage = lazy(() =>
  import('../marketing/pages/LandingPage').then((m) => ({ default: m.LandingPage })),
)
const PrestationsPage = lazy(() =>
  import('../marketing/pages/PrestationsPage').then((m) => ({ default: m.PrestationsPage })),
)
const FeaturesPage = lazy(() =>
  import('../marketing/pages/FeaturesPage').then((m) => ({ default: m.FeaturesPage })),
)
const ElectronicInvoicingPage = lazy(() =>
  import('../marketing/pages/ElectronicInvoicingPage').then((m) => ({ default: m.ElectronicInvoicingPage })),
)
const PricingPage = lazy(() =>
  import('../marketing/pages/PricingPage').then((m) => ({ default: m.PricingPage })),
)
const LegalPage = lazy(() => import('../marketing/pages/LegalPage').then((m) => ({ default: m.LegalPage })))
const PrivacyPage = lazy(() =>
  import('../marketing/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
)
const TermsPage = lazy(() => import('../marketing/pages/TermsPage').then((m) => ({ default: m.TermsPage })))
const SalesTermsPage = lazy(() =>
  import('../marketing/pages/SalesTermsPage').then((m) => ({ default: m.SalesTermsPage })),
)
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { SignupConfirmationPage } from './pages/SignupConfirmationPage'
import { OnboardingInstallPage } from './pages/OnboardingInstallPage'
import { OnboardingRoute } from '../../components/OnboardingRoute'
import { AuthSessionHydrator } from '../../components/AuthSessionHydrator'
import { SeoManager } from '../../components/SeoManager'
import { GoogleAnalytics } from '../../components/GoogleAnalytics'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { AuthBootPage } from './pages/AuthBootPage'
import { ConfirmDevicePage } from './pages/ConfirmDevicePage'
import { PublicQuotePage } from './pages/PublicQuotePage'
import { PublicQuoteAcceptPage } from './pages/PublicQuoteAcceptPage'
import { PublicQuoteRejectPage } from './pages/PublicQuoteRejectPage'
import { ClientInvoicePage } from './pages/ClientInvoicePage'
import { ClientPaymentLayout } from './components/ClientPaymentLayout'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { InvoiceDetailPage } from '../invoices/InvoiceDetailPage'
import { QuoteDetailPage } from '../quotes/QuoteDetailPage'
import { PublicPayableDebtPage } from '../finance/PublicPayableDebtPage'
import { PayableDebtDetailPage } from '../finance/PayableDebtDetailPage'

// Lazy loading des pages pour optimiser les performances
const DashboardPage = lazy(() => import('../dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ClientsSegmentRouteLazy = lazy(() =>
  import('./routes/clientFolderRoutes').then((m) => ({ default: m.ClientsSegmentRoute })),
)
const FacturesSegmentRouteLazy = lazy(() =>
  import('./routes/documentFolderRoutes').then((m) => ({ default: m.FacturesSegmentRoute })),
)
const DevisSegmentRouteLazy = lazy(() =>
  import('./routes/documentFolderRoutes').then((m) => ({ default: m.DevisSegmentRoute })),
)
const DettesSegmentRouteLazy = lazy(() =>
  import('./routes/documentFolderRoutes').then((m) => ({ default: m.DettesSegmentRoute })),
)
const ArchivesPage = lazy(() => import('../archives/ArchivesPage').then(m => ({ default: m.ArchivesPage })))
const InvoicesArchivePage = lazy(() =>
  import('../invoices/InvoicesArchivePage').then(m => ({ default: m.InvoicesArchivePage })),
)
const QuotesArchivePage = lazy(() =>
  import('../quotes/QuotesArchivePage').then(m => ({ default: m.QuotesArchivePage })),
)
const InvoiceEditPage = lazy(() =>
  import('../invoices/InvoiceEditPage').then((m) => ({ default: m.InvoiceEditPage })),
)
const QuoteEditPage = lazy(() =>
  import('../quotes/QuoteEditPage').then((m) => ({ default: m.QuoteEditPage })),
)
const ProductsPage = lazy(() => import('../products/ProductsPage').then(m => ({ default: m.ProductsPage })))
const ProspectsPage = lazy(() => import('../prospects/ProspectsPage').then(m => ({ default: m.ProspectsPage })))
const TaxesPage = lazy(() => import('../taxes/TaxesPage').then(m => ({ default: m.TaxesPage })))
const SubscriptionsPage = lazy(() => import('../subscriptions/SubscriptionsPage').then(m => ({ default: m.SubscriptionsPage })))
const FilingsPage = lazy(() => import('../filings/FilingsPage').then(m => ({ default: m.FilingsPage })))
const AccountingPage = lazy(() => import('../accounting/AccountingPage').then(m => ({ default: m.AccountingPage })))
const ReceivablesPage = lazy(() =>
  import('../finance/ReceivablesPage').then((m) => ({ default: m.ReceivablesPage })),
)
const PayablesPage = lazy(() =>
  import('../finance/PayablesPage').then((m) => ({ default: m.PayablesPage })),
)
const PayablesArchivePage = lazy(() =>
  import('../finance/PayablesArchivePage').then((m) => ({ default: m.PayablesArchivePage })),
)
const SettingsLayout = lazy(() => import('../account/SettingsLayout').then(m => ({ default: m.SettingsLayout })))
const SettingsIndexPage = lazy(() =>
  import('../account/pages/SettingsIndexPage').then(m => ({ default: m.SettingsIndexPage })),
)
const SettingsCompanyPage = lazy(() =>
  import('../account/pages/SettingsCompanyPage').then(m => ({ default: m.SettingsCompanyPage })),
)
const SettingsBillingPage = lazy(() =>
  import('../account/pages/SettingsBillingPage').then(m => ({ default: m.SettingsBillingPage })),
)
const SettingsEInvoicingPage = lazy(() =>
  import('../account/pages/SettingsEInvoicingPage').then(m => ({ default: m.SettingsEInvoicingPage })),
)
const SettingsPaymentsPage = lazy(() =>
  import('../account/pages/SettingsPaymentsPage').then(m => ({ default: m.SettingsPaymentsPage })),
)
const SettingsPrivacyPage = lazy(() =>
  import('../account/pages/SettingsPrivacyPage').then(m => ({ default: m.SettingsPrivacyPage })),
)
const SettingsDataPage = lazy(() =>
  import('../account/pages/SettingsDataPage').then(m => ({ default: m.SettingsDataPage })),
)
const GlobalStateDemo = lazy(() => import('../../components/GlobalStateDemo').then(m => ({ default: m.GlobalStateDemo })))
const LoaderDemo = lazy(() => import('../../components/LoaderDemo').then(m => ({ default: m.LoaderDemo })))
const ApiTokensPage = lazy(() =>
  import('../api-access').then((m) => ({ default: m.ApiTokensPage })),
)
const ApiDocsPage = lazy(() =>
  import('../api-access').then((m) => ({ default: m.ApiDocsPage })),
)

function LegacyPublicInvoiceRedirect() {
  const { token } = useParams<{ token: string }>()
  return <Navigate to={token ? `/facture/${token}` : '/'} replace />
}

export function App() {
  // État des paramètres du thème
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('theme-settings')
    return saved ? JSON.parse(saved) : {
      mode: 'light',
      primary: '#1976d2',
      secondary: '#9c27b0',
      radius: 10,
      density: 'comfortable' as const,
    }
  })

  // État du drawer des paramètres
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Sauvegarder les paramètres dans localStorage
  useEffect(() => {
    localStorage.setItem('theme-settings', JSON.stringify(settings))
  }, [settings])

  // Créer le thème personnalisé
  const theme = createCustomTheme(settings)

  // Gestionnaires d'événements
  const handleToggleMode = () => {
    const next = settings.mode === 'light' ? 'dark' : 'light'
    const newSettings: ThemeSettings = { ...settings, mode: next }
    setSettings(newSettings)
  }

  const handleOpenSettings = () => {
    setSettingsOpen(true)
  }

  const handleCloseSettings = () => {
    setSettingsOpen(false)
  }

  const handleSettingsChange = (newSettings: ThemeSettings) => {
    setSettings(newSettings)
  }

  // Wrapper pour les routes privées avec layout
  const PrivateRouteWrapper = ({ children }: { children: ReactNode }) => (
    <ProtectedRoute>
      <OnboardingRoute>
        <FinanceRealtimeBridge />
        <AppLayout
          mode={settings.mode}
          onToggleMode={handleToggleMode}
          onOpenSettings={handleOpenSettings}
        >
          {children}
        </AppLayout>
      </OnboardingRoute>
    </ProtectedRoute>
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <BrowserRouter>
          <AuthSessionHydrator />
          <SeoManager />
          <GoogleAnalytics />
          <TopRouteProgress />
          
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress />
            </Box>
          }>
            <RouterRoutes>
              {/* Routes publiques */}
              <Route
                path="/"
                element={
                  <PublicLayout>
                    <LandingPage />
                  </PublicLayout>
                }
              />
              <Route path="/prestations" element={<PublicLayout><PrestationsPage /></PublicLayout>} />
              <Route path="/fonctionnalites" element={<PublicLayout><FeaturesPage /></PublicLayout>} />
              <Route path="/facturation-electronique" element={<PublicLayout><ElectronicInvoicingPage /></PublicLayout>} />
              <Route path="/tarifs" element={<PublicLayout><PricingPage /></PublicLayout>} />
              <Route path="/legal" element={<PublicLayout><LegalPage /></PublicLayout>} />
              <Route path="/privacy" element={<PublicLayout><PrivacyPage /></PublicLayout>} />
              <Route path="/terms" element={<PublicLayout><TermsPage /></PublicLayout>} />
              <Route path="/cgv" element={<PublicLayout><SalesTermsPage /></PublicLayout>} />
              <Route
                path="/login"
                element={
                  <PublicLayout>
                    <LoginPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicLayout>
                    <SignupPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/mot-de-passe-oublie"
                element={
                  <PublicLayout>
                    <ForgotPasswordPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/reinitialiser-mot-de-passe/:token"
                element={
                  <PublicLayout>
                    <ResetPasswordPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/verifier-email/:token"
                element={
                  <PublicLayout>
                    <VerifyEmailPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/auth/callback"
                element={<AuthCallbackPage />}
              />
              <Route path="/auth/session" element={<AuthBootPage />} />
              <Route path="/auth/confirmer-appareil" element={<ConfirmDevicePage />} />

              <Route
                path="/installation"
                element={
                  <ProtectedRoute>
                    <OnboardingInstallPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inscription/confirmation"
                element={
                  <ProtectedRoute>
                    <SignupConfirmationPage />
                  </ProtectedRoute>
                }
              />

              {/* Routes publiques devis / factures (accès par token) */}
              <Route
                path="/public/devis/:token"
                element={
                  <PublicLayout>
                    <PublicQuotePage />
                  </PublicLayout>
                }
              />
              <Route
                path="/public/devis/:token/accepter"
                element={
                  <PublicLayout>
                    <PublicQuoteAcceptPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/public/devis/:token/refuser"
                element={
                  <PublicLayout>
                    <PublicQuoteRejectPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/facture/:token"
                element={
                  <ClientPaymentLayout>
                    <ClientInvoicePage />
                  </ClientPaymentLayout>
                }
              />
              <Route
                path="/dette/:token"
                element={
                  <PublicLayout>
                    <PublicPayableDebtPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/public/factures/:token"
                element={<LegacyPublicInvoiceRedirect />}
              />

              {/* Routes privées (protégées) */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRouteWrapper>
                    <DashboardPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route path="/clients" element={<Navigate to="/clients/inbox" replace />} />
              <Route
                path="/clients/:folder"
                element={
                  <PrivateRouteWrapper>
                    <Suspense fallback={<DocumentFolderRouteFallback resource="clients" />}>
                      <ClientsSegmentRouteLazy />
                    </Suspense>
                  </PrivateRouteWrapper>
                }
              />
              <Route path="/devis" element={<Navigate to="/devis/inbox" replace />} />
              <Route
                path="/devis/archive"
                element={<Navigate to="/devis/archives" replace />}
              />
              <Route
                path="/devis/archives"
                element={
                  <PrivateRouteWrapper>
                    <QuotesArchivePage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/devis/:folder"
                element={
                  <PrivateRouteWrapper>
                    <Suspense fallback={<DocumentFolderRouteFallback resource="devis" />}>
                      <DevisSegmentRouteLazy />
                    </Suspense>
                  </PrivateRouteWrapper>
                }
              />
              <Route path="/factures" element={<Navigate to="/factures/inbox" replace />} />
              <Route
                path="/factures/archive"
                element={<Navigate to="/factures/archives" replace />}
              />
              <Route
                path="/factures/archives"
                element={
                  <PrivateRouteWrapper>
                    <InvoicesArchivePage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/factures/voir/:id"
                element={
                  <PrivateRouteWrapper>
                    <InvoiceDetailPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/factures/:id/edit"
                element={
                  <PrivateRouteWrapper>
                    <Suspense fallback={<DocumentFolderRouteFallback resource="factures" />}>
                      <InvoiceEditPage />
                    </Suspense>
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/devis/voir/:id"
                element={
                  <PrivateRouteWrapper>
                    <QuoteDetailPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/devis/:id/edit"
                element={
                  <PrivateRouteWrapper>
                    <Suspense fallback={<DocumentFolderRouteFallback resource="devis" />}>
                      <QuoteEditPage />
                    </Suspense>
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/factures/:folder"
                element={
                  <PrivateRouteWrapper>
                    <Suspense fallback={<DocumentFolderRouteFallback resource="factures" />}>
                      <FacturesSegmentRouteLazy />
                    </Suspense>
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/archives"
                element={
                  <PrivateRouteWrapper>
                    <ArchivesPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/produits"
                element={
                  <PrivateRouteWrapper>
                    <Suspense fallback={<ProductCatalogRouteFallback />}>
                      <ProductsPage />
                    </Suspense>
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/prospection"
                element={
                  <PrivateRouteWrapper>
                    <ProspectsPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/taxes"
                element={
                  <PrivateRouteWrapper>
                    <TaxesPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/abonnements"
                element={
                  <PrivateRouteWrapper>
                    <SubscriptionsPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/declarations"
                element={
                  <PrivateRouteWrapper>
                    <FilingsPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/comptabilite"
                element={
                  <PrivateRouteWrapper>
                    <AccountingPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/creances"
                element={
                  <PrivateRouteWrapper>
                    <ReceivablesPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route path="/dettes" element={<Navigate to="/dettes/inbox" replace />} />
              <Route
                path="/dettes/archive"
                element={<Navigate to="/dettes/archives" replace />}
              />
              <Route
                path="/dettes/archives"
                element={
                  <PrivateRouteWrapper>
                    <Suspense fallback={<DocumentFolderRouteFallback resource="dettes" />}>
                      <PayablesArchivePage />
                    </Suspense>
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/dettes/voir/:id"
                element={
                  <PrivateRouteWrapper>
                    <PayableDebtDetailPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/dettes/:folder"
                element={
                  <PrivateRouteWrapper>
                    <Suspense fallback={<DocumentFolderRouteFallback resource="dettes" />}>
                      <DettesSegmentRouteLazy />
                    </Suspense>
                  </PrivateRouteWrapper>
                }
              />
              <Route path="/finance/creances" element={<Navigate to="/creances" replace />} />
              <Route path="/commercial/creances" element={<Navigate to="/creances" replace />} />
              <Route path="/finance/dettes" element={<Navigate to="/dettes/inbox" replace />} />
              <Route path="/commercial/dettes" element={<Navigate to="/dettes/inbox" replace />} />
              <Route path="/finance/dettes/archives" element={<Navigate to="/dettes/archives" replace />} />
              <Route
                path="/commercial/dettes/archives"
                element={<Navigate to="/dettes/archives" replace />}
              />
              <Route path="/finance/dettes/voir/:id" element={<LegacyDetteVoirRedirect />} />
              <Route path="/commercial/dettes/voir/:id" element={<LegacyDetteVoirRedirect />} />
              <Route path="/finance/dettes/:folder" element={<LegacyDetteFolderRedirect />} />
              <Route path="/commercial/dettes/:folder" element={<LegacyDetteFolderRedirect />} />
              <Route
                path="/parametres"
                element={
                  <PrivateRouteWrapper>
                    <SettingsLayout />
                  </PrivateRouteWrapper>
                }
              >
                <Route index element={<SettingsIndexPage />} />
                <Route path="entreprise" element={<SettingsCompanyPage />} />
                <Route path="abonnement" element={<SettingsBillingPage />} />
                <Route path="facturation-electronique" element={<SettingsEInvoicingPage />} />
                <Route path="paiements" element={<SettingsPaymentsPage />} />
                <Route path="confidentialite" element={<SettingsPrivacyPage />} />
                <Route path="donnees" element={<SettingsDataPage />} />
                <Route path="tokens" element={<ApiTokensPage />} />
                <Route path="api-docs" element={<ApiDocsPage />} />
              </Route>
              <Route path="/tokens" element={<Navigate to="/parametres/tokens" replace />} />
              <Route path="/api-docs" element={<Navigate to="/parametres/api-docs" replace />} />
              <Route
                path="/demo"
                element={
                  <PrivateRouteWrapper>
                    <GlobalStateDemo />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/loaders"
                element={
                  <PrivateRouteWrapper>
                    <LoaderDemo />
                  </PrivateRouteWrapper>
                }
              />
            </RouterRoutes>
          </Suspense>

          <ThemeSettingsDrawer
            open={settingsOpen}
            onClose={handleCloseSettings}
            settings={settings}
            onChange={handleSettingsChange}
          />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}

function LegacyDetteVoirRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/dettes/voir/${id ?? ''}`} replace />
}

function LegacyDetteFolderRedirect() {
  const { folder } = useParams<{ folder: string }>()
  return <Navigate to={`/dettes/${folder ?? 'inbox'}`} replace />
}

