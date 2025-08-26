import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { createCustomTheme } from './theme/theme';
import { useTheme } from './hooks/useStores';
import { AppLayout } from './modules/app/components/AppLayout';
import { ThemeSettingsDrawer } from './modules/app/components/ThemeSettingsDrawer';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { ClientsPage } from './modules/clients/ClientsPage';
import { InvoicesPage } from './modules/invoices/InvoicesPage';
import { ProductsPage } from './modules/products/ProductsPage';
import { TaxesPage } from './modules/taxes/TaxesPage';
import { SubscriptionsPage } from './modules/subscriptions/SubscriptionsPage';
import { FilingsPage } from './modules/filings/FilingsPage';
import { AccountingPage } from './modules/accounting/AccountingPage';
import { ToastContainer, useToast } from './components/Toast';
import { StoreDemo } from './components/StoreDemo';

function App() {
  const themeStore = useTheme();
  const { addToast } = useToast();

  // Créer le thème personnalisé
  const theme = createCustomTheme(themeStore.settings);

  const toggleMode = () => {
    themeStore.updateSettings({
      mode: themeStore.settings.mode === 'light' ? 'dark' : 'light'
    });
  };

  const handleSettingsChange = (newSettings: any) => {
    themeStore.updateSettings(newSettings);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppLayout 
          mode={themeStore.settings.mode}
          onToggleMode={toggleMode}
          onOpenSettings={() => addToast({
            severity: 'info',
            title: 'Paramètres du thème',
            message: 'Utilisez le store Zustand pour gérer le thème',
            duration: 3000,
          })}
        />
        <ThemeSettingsDrawer 
          open={false}
          settings={themeStore.settings}
          onClose={() => {}}
          onChange={handleSettingsChange}
        />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/taxes" element={<TaxesPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/filings" element={<FilingsPage />} />
          <Route path="/accounting" element={<AccountingPage />} />
          <Route path="/demo" element={<StoreDemo />} />
        </Routes>
        <ToastContainer toasts={[]} onClose={() => {}} />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
