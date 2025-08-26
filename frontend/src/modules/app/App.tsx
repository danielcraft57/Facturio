import type { ReactNode } from 'react'
import { BrowserRouter, Route, Routes as RouterRoutes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { useState, useEffect } from 'react'
import { createCustomTheme, type ThemeSettings } from '../../theme/theme'
import { AppLayout } from './components/AppLayout'
import { ThemeSettingsDrawer } from './components/ThemeSettingsDrawer'
import { ToastContainer, useToast } from '../../components/Toast'
import { DashboardPage } from '../dashboard/DashboardPage'
import { ClientsPage } from '../clients/ClientsPage'
import { QuotesPage } from '../quotes/QuotesPage'
import { InvoicesPage } from '../invoices/InvoicesPage'
import { ProductsPage } from '../products/ProductsPage'
import { TaxesPage } from '../taxes/TaxesPage'
import { SubscriptionsPage } from '../subscriptions/SubscriptionsPage'
import { FilingsPage } from '../filings/FilingsPage'
import { AccountingPage } from '../accounting/AccountingPage'
import { GlobalStateDemo } from '../../components/GlobalStateDemo'
import { ModernPageLoader } from '../../components/AdvancedPageLoader'
import { LoaderDemo } from '../../components/LoaderDemo'

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
            <RouterRoutes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/devis" element={<QuotesPage />} />
              <Route path="/factures" element={<InvoicesPage />} />
              <Route path="/produits" element={<ProductsPage />} />
              <Route path="/taxes" element={<TaxesPage />} />
              <Route path="/abonnements" element={<SubscriptionsPage />} />
              <Route path="/declarations" element={<FilingsPage />} />
              <Route path="/comptabilite" element={<AccountingPage />} />
              <Route path="/demo" element={<GlobalStateDemo />} />
              <Route path="/loaders" element={<LoaderDemo />} />
            </RouterRoutes>
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


