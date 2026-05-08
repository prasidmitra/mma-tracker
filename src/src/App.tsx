import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreatorDetail } from './pages/CreatorDetail';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <DataProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="creator/:slug" element={<CreatorDetail />} />
          </Route>
        </Routes>
      </DataProvider>
    </BrowserRouter>
  );
}
