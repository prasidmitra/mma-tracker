import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreatorDetail } from './pages/CreatorDetail';
import { Compare } from './pages/Compare';
import { About } from './pages/About';
import { Admin } from './pages/Admin';
import { Navbar } from './components/Navbar';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="creator/:slug" element={<CreatorDetail />} />
        <Route path="compare" element={<Compare />} />
      </Route>
      <Route path="about" element={<><Navbar /><About /></>} />
      <Route path="admin" element={<Admin />} />
    </Routes>
  );
}
