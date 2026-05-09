import { createContext, useContext, useEffect, type ReactNode } from 'react';

interface ThemeContextValue {
  theme: 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.removeItem('theme');
  }, []);
  return <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {} }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
