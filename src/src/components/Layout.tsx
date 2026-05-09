import { createContext, useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useData } from '../hooks/useData';
import { useIsMobile } from '../hooks/useIsMobile';

interface FilterDrawerCtx { openDrawer: () => void; }
const FilterDrawerContext = createContext<FilterDrawerCtx>({ openDrawer: () => {} });
export function useFilterDrawer() { return useContext(FilterDrawerContext); }

export function Layout() {
  const { events } = useData();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <FilterDrawerContext.Provider value={{ openDrawer: () => setDrawerOpen(true) }}>
      <div style={{ minHeight: '100vh' }}>
        <Navbar />

        {/* Mobile: filter bottom drawer */}
        {isMobile && drawerOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300 }}
              onClick={() => setDrawerOpen(false)}
            />
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: 'var(--panel)',
              borderTop: '2px solid var(--border)',
              borderRadius: '16px 16px 0 0',
              zIndex: 301,
              maxHeight: '78vh',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>Filters</span>
                <button onClick={() => setDrawerOpen(false)} style={{
                  background: 'none', border: 'none', color: 'var(--muted)',
                  fontSize: '1.1rem', cursor: 'pointer', padding: '0 0.25rem', lineHeight: 1,
                }}>✕</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <Sidebar events={events} asDrawer />
              </div>
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    width: '100%', padding: '0.7rem', background: '#E1006A',
                    border: 'none', borderRadius: '8px', color: '#fff',
                    fontWeight: 700, fontSize: '0.9rem', fontFamily: "'Manrope', sans-serif", cursor: 'pointer',
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex' }}>
          {!isMobile && <Sidebar events={events} />}
          <main style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </FilterDrawerContext.Provider>
  );
}
