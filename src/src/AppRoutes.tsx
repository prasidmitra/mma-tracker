import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreatorDetail } from './pages/CreatorDetail';
import { Compare } from './pages/Compare';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Admin } from './pages/Admin';
import { Navbar } from './components/Navbar';

declare global { interface Window { gtag?: (...args: unknown[]) => void; } }

function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    window.gtag?.('event', 'page_view', { page_path: location.pathname });
  }, [location.pathname]);
}

export function AppRoutes() {
  usePageTracking();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="creator/:slug" element={<CreatorDetail />} />
        <Route path="compare" element={<Compare />} />
      </Route>
      <Route path="about" element={<><Navbar /><About /></>} />
      <Route path="contact" element={<Contact />} />
      <Route path="admin" element={<Admin />} />
    </Routes>
  );
}
