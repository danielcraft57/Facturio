import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes as RouterRoutes, useParams } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline, CircularProgress, Box } from '@mui/material'
import { useState, useEffect, lazy, Suspense } from 'react'
import { createCustomTheme, type ThemeSettings } from '../../theme/theme'
import { AppLayout } from './components/AppLayout'
import { PublicLayout } from './components/PublicLayout'
import { ThemeSettingsDrawer } from './components/ThemeSettingsDrawer'
import { ToastContainer, useToast } from '../../components/Toast'
import { ModernPageLoader } from '../../components/AdvancedPageLoader'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { PublicQuotePage } from './pages/PublicQuotePage'
import { PublicQuoteAcceptPage } from './pages/PublicQuoteAcceptPage'
import { PublicQuoteRejectPage } from './pages/PublicQuoteRejectPage'
import { ClientInvoicePage } from './pages/ClientInvoicePage'
import { ClientPaymentLayout } from './components/ClientPaymentLayout'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'

// Lazy loading des pages pour optimiser les performances
const DashboardPage = lazy(() => import('../dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ClientsPage = lazy(() => import('../clients/ClientsPage').then(m => ({ default: m.ClientsPage })))
const ClientDetailPage = lazy(() => import('../clients/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })))
const QuotesPage = lazy(() => import('../quotes/QuotesPage').then(m => ({ default: m.QuotesPage })))
const InvoicesPage = lazy(() => import('../invoices/InvoicesPage').then(m => ({ default: m.InvoicesPage })))
const InvoiceDetailPage = lazy(() => import('../invoices/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })))
const ProductsPage = lazy(() => import('../products/ProductsPage').then(m => ({ default: m.ProductsPage })))
const ProspectsPage = lazy(() => import('../prospects/ProspectsPage').then(m => ({ default: m.ProspectsPage })))
const TaxesPage = lazy(() => import('../taxes/TaxesPage').then(m => ({ default: m.TaxesPage })))
const SubscriptionsPage = lazy(() => import('../subscriptions/SubscriptionsPage').then(m => ({ default: m.SubscriptionsPage })))
const FilingsPage = lazy(() => import('../filings/FilingsPage').then(m => ({ default: m.FilingsPage })))
const AccountingPage = lazy(() => import('../accounting/AccountingPage').then(m => ({ default: m.AccountingPage })))
const AccountPage = lazy(() => import('../account/AccountPage').then(m => ({ default: m.AccountPage })))
const GlobalStateDemo = lazy(() => import('../../components/GlobalStateDemo').then(m => ({ default: m.GlobalStateDemo })))
const LoaderDemo = lazy(() => import('../../components/LoaderDemo').then(m => ({ default: m.LoaderDemo })))

// Composant pour gérer les toasts globaux
function AppWithToasts({ children }: { children: ReactNode }) {
  const toast = useToast()

  // Exposer le toast globalement pour les tests
  if (typeof window !== 'undefined') {
    ;(window as any).toast = toast
  }

  return (
    <>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      {children}
    </>
  )
}

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
      <AppLayout
        mode={settings.mode}
        onToggleMode={handleToggleMode}
        onOpenSettings={handleOpenSettings}
      >
        {children}
      </AppLayout>
    </ProtectedRoute>
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppWithToasts>
        <BrowserRouter>
          {/* Barre de chargement moderne entre les pages */}
          <ModernPageLoader 
            height={3}
            duration={600}
            color="rainbow"
          />
          
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
              <Route
                path="/clients"
                element={
                  <PrivateRouteWrapper>
                    <ClientsPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/clients/:id"
                element={
                  <PrivateRouteWrapper>
                    <ClientDetailPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/devis"
                element={
                  <PrivateRouteWrapper>
                    <QuotesPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/factures"
                element={
                  <PrivateRouteWrapper>
                    <InvoicesPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/factures/:id"
                element={
                  <PrivateRouteWrapper>
                    <InvoiceDetailPage />
                  </PrivateRouteWrapper>
                }
              />
              <Route
                path="/produits"
                element={
                  <PrivateRouteWrapper>
                    <ProductsPage />
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
                path="/parametres"
                element={
                  <PrivateRouteWrapper>
                    <AccountPage />
                  </PrivateRouteWrapper>
                }
              />
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
      </AppWithToasts>
    </ThemeProvider>
  )
}


