import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { HomePage } from './pages/HomePage';
import { SessionsPage } from './pages/SessionsPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { ManualSessionPage } from './pages/ManualSessionPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { TemplateBuilderPage } from './pages/TemplateBuilderPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { ClientNoteFormPage } from './pages/ClientNoteFormPage';
import { ClientNoteDetailPage } from './pages/ClientNoteDetailPage';
import { NotesPage } from './pages/NotesPage';
import { AssistantPage } from './pages/AssistantPage';
import PricingPage from './pages/PricingPage';
import { InvoiceListPage } from './pages/InvoiceListPage';
import { NewInvoicePage } from './pages/NewInvoicePage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import {
  SettingsIndexPage,
  ProfileSettingsPage,
  BillingSettingsPage,
  DataManagementSettingsPage,
  SecuritySettingsPage,
  ConsentFormSettingsPage,
  ContactUsSettingsPage,
  FatturazionePage,
} from './pages/settings';
import { Toaster } from './components/ui/toaster';
import { AxiosProvider } from './contexts/AxiosContext';

function AppContent() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/sessions/new" element={<ManualSessionPage />} />
            <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/templates/new" element={<TemplateBuilderPage />} />
            <Route path="/templates/:templateId/edit" element={<TemplateBuilderPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:clientId" element={<ClientDetailPage />} />
            <Route path="/clients/:clientId/notes/new" element={<ClientNoteFormPage />} />
            <Route path="/clients/:clientId/notes/:noteId" element={<ClientNoteDetailPage />} />
            <Route path="/fatture" element={<InvoiceListPage />} />
            <Route path="/fatture/new" element={<NewInvoicePage />} />
            <Route path="/fatture/:invoiceId" element={<InvoiceDetailPage />} />
            <Route path="/settings" element={<SettingsIndexPage />} />
            <Route path="/settings/profile" element={<ProfileSettingsPage />} />
            <Route path="/settings/billing" element={<BillingSettingsPage />} />
            <Route path="/settings/fatturazione" element={<FatturazionePage />} />
            <Route path="/settings/data-management" element={<DataManagementSettingsPage />} />
            <Route path="/settings/security" element={<SecuritySettingsPage />} />
            <Route path="/settings/consent-form" element={<ConsentFormSettingsPage />} />
            <Route path="/settings/contact" element={<ContactUsSettingsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
          </Routes>
        </main>
      </div>
      <MobileNav />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AxiosProvider>
        <AppContent />
      </AxiosProvider>
    </BrowserRouter>
  );
}

export default App;
