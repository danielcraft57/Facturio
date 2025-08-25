import { CssBaseline, ThemeProvider } from '@mui/material'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { createCustomTheme } from '../../theme/theme'
import type { ThemeSettings } from '../../theme/theme'
import { AppLayout } from './components/AppLayout'
import { ThemeSettingsDrawer } from './components/ThemeSettingsDrawer'
import { DashboardPage } from '../dashboard/DashboardPage'
import { ClientsPage } from '../clients/ClientsPage'
import { QuotesPage } from '../quotes/QuotesPage'
import { InvoicesPage } from '../invoices/InvoicesPage'
import { ProductsPage } from '../products/ProductsPage'
import { TaxesPage } from '../taxes/TaxesPage'
import { SubscriptionsPage } from '../subscriptions/SubscriptionsPage'
import { FilingsPage } from '../filings/FilingsPage'
import { AccountingPage } from '../accounting/AccountingPage'

export default function App() {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    const raw = localStorage.getItem('theme-settings')
    return raw ? JSON.parse(raw) as ThemeSettings : { mode: 'light', primary: '#1976d2', secondary: '#9c27b0', radius: 10, density: 'comfortable' }
  })

  const theme = useMemo(() => createCustomTheme(settings), [settings])

  const toggleMode = () => {
    const next = settings.mode === 'light' ? 'dark' : 'light'
    const newSettings: ThemeSettings = { ...settings, mode: next }
    setSettings(newSettings)
    localStorage.setItem('theme-settings', JSON.stringify(newSettings))
  }

  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleChangeSettings = (next: ThemeSettings) => {
    setSettings(next)
    localStorage.setItem('theme-settings', JSON.stringify(next))
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppLayout mode={settings.mode} onToggleMode={toggleMode} onOpenSettings={() => setDrawerOpen(true)}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/devis" element={<QuotesPage />} />
            <Route path="/factures" element={<InvoicesPage />} />
            <Route path="/produits" element={<ProductsPage />} />
            <Route path="/taxes" element={<TaxesPage />} />
            <Route path="/abonnements" element={<SubscriptionsPage />} />
            <Route path="/declarations" element={<FilingsPage />} />
            <Route path="/comptabilite" element={<AccountingPage />} />
          </Routes>
        </AppLayout>
        <ThemeSettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} settings={settings} onChange={handleChangeSettings} />
      </BrowserRouter>
    </ThemeProvider>
  )
}


