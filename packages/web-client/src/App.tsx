// Main React Application Component
// Componente principal da aplicação React

import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { SettingsPage } from '@/pages/SettingsPage';

function App() {
  const { i18n } = useTranslation();

  // Set document language attribute for accessibility
  document.documentElement.lang = i18n.language;

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;