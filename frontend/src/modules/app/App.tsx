import type { ReactNode } from 'react'
import { BrowserRouter, Route, Routes as RouterRoutes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline, CircularProgress, Box } from '@mui/material'
import { useState, useEffect, lazy, Suspense } from 'react'
import { createCustomTheme, type ThemeSettings } from '../../theme/theme'
import { AppLayout } from './components/AppLayout'
import { ThemeSettingsDrawer } from './components/ThemeSettingsDrawer'
import { ToastContainer, useToast } from '../../components/Toast'
import { ModernPageLoader } from '../../components/AdvancedPageLoader'

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppWithToasts>
        <BrowserRouter>
          {/* Barre de chargement entre les pages */}
          <ModernPageLoader 
            height={3}
            duration={800}
            color="primary"
          />
          
          <AppLayout
            mode={settings.mode}
            onToggleMode={handleToggleMode}
            onOpenSettings={handleOpenSettings}
          >
            <Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
              </Box>
            }>
            <RouterRoutes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsPage />} />
                <Route path="/clients/:id" element={<ClientDetailPage />} />
              <Route path="/devis" element={<QuotesPage />} />
              <Route path="/factures" element={<InvoicesPage />} />
                <Route path="/factures/:id" element={<InvoiceDetailPage />} />
              <Route path="/produits" element={<ProductsPage />} />
              <Route path="/prospection" element={<ProspectsPage />} />
              <Route path="/taxes" element={<TaxesPage />} />
              <Route path="/abonnements" element={<SubscriptionsPage />} />
              <Route path="/declarations" element={<FilingsPage />} />
              <Route path="/comptabilite" element={<AccountingPage />} />
              <Route path="/demo" element={<GlobalStateDemo />} />
              <Route path="/loaders" element={<LoaderDemo />} />
            </RouterRoutes>
            </Suspense>
          </AppLayout>

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


