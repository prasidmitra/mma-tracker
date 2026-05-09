import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './AppRoutes';

export function render(route: string, basename: string) {
  const helmetContext: Record<string, unknown> = {};
  const strippedBase = basename.replace(/\/$/, '');
  const location = strippedBase + (route === '/' ? '' : route) || '/';
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={location} basename={basename}>
        <ThemeProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </ThemeProvider>
      </StaticRouter>
    </HelmetProvider>
  );
  const { helmet } = helmetContext as { helmet: Record<string, { toString(): string }> };
  return { html, helmet };
}
