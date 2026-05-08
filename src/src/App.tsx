import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './AppRoutes';

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ThemeProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
