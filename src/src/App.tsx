import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreatorDetail } from './pages/CreatorDetail';
import { About } from './pages/About';
import { Navbar } from './components/Navbar';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <DataProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="creator/:slug" element={<CreatorDetail />} />
            </Route>
            <Route path="about" element={<><Navbar /><About /></>} />
          </Routes>
        </DataProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
