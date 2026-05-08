import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ALL_CREATORS, CREATOR_DISPLAY } from '../utils/accuracy';
import { useIsMobile } from '../hooks/useIsMobile';
import { useData } from '../context/DataContext';
import logo from '../assets/logo.png';

const LOGO_HEIGHT = 48;

const navLinkStyle = {
  color: 'var(--text-secondary)' as const,
  fontSize: '1rem',
  fontWeight: 600,
  textDecoration: 'none' as const,
};

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { predictions } = useData();

  const sortedCreators = useMemo(() =>
    ALL_CREATORS
      .filter(slug => predictions.some(p => p.creator === slug))
      .sort((a, b) => CREATOR_DISPLAY[a].localeCompare(CREATOR_DISPLAY[b])),
    [predictions]
  );

  const closeHamburger = () => setHamburgerOpen(false);

  return (
    <>
      <nav style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.25rem',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }} onClick={closeHamburger}>
          <img
            src={logo}
            alt="OctaScore"
            style={{ height: isMobile ? '36px' : `${LOGO_HEIGHT}px`, width: 'auto', display: 'block' }}
          />
        </Link>

        {isMobile ? (
          /* ── Mobile right side: hamburger ── */
          <button
            onClick={() => setHamburgerOpen(o => !o)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
              fontFamily: 'inherit',
            }}
            aria-label="Menu"
          >
            {hamburgerOpen ? '✕' : '☰'}
          </button>
        ) : (
          /* ── Desktop: center links + right controls ── */
          <>
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <Link to="/" style={navLinkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >Leaderboard</Link>

              <div style={{ position: 'relative' }}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  fontSize: '1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0',
                }}>
                  Creators <span style={{ fontSize: '0.85rem' }}>▾</span>
                </button>
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '0.375rem 0', minWidth: '180px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 200,
                  }}>
                    {sortedCreators.map(slug => (
                      <button key={slug}
                        onClick={() => { navigate(`/creator/${slug}`); setDropdownOpen(false); }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '0.5rem 1rem', background: 'none', border: 'none',
                          color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        {CREATOR_DISPLAY[slug]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/about" style={navLinkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >About</Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={toggleTheme} style={{
                background: 'var(--bg-row-alt)', border: '1px solid var(--border)',
                borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '0.75rem',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                padding: '4px 10px', transition: 'all 0.15s ease',
              }}>
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
              <a href="https://github.com/prasidmitra/mma-tracker" target="_blank" rel="noreferrer"
                style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>
                GitHub
              </a>
            </div>
          </>
        )}
      </nav>

      {/* ── Mobile hamburger menu panel ── */}
      {isMobile && hamburgerOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(0,0,0,0.5)' }}
            onClick={closeHamburger}
          />
          <div style={{
            position: 'fixed', top: '72px', left: 0, right: 0,
            background: 'var(--panel)', borderBottom: '1px solid var(--border)',
            zIndex: 99, maxHeight: 'calc(100vh - 72px)', overflowY: 'auto',
          }}>
            {/* Main nav links */}
            {[{ label: 'Leaderboard', to: '/' }, { label: 'About', to: '/about' }].map(({ label, to }) => (
              <Link key={to} to={to} onClick={closeHamburger} style={{
                display: 'block', padding: '0.875rem 1.25rem',
                color: 'var(--text)', fontSize: '1rem', fontWeight: 600,
                textDecoration: 'none', borderBottom: '1px solid var(--border)',
              }}>
                {label}
              </Link>
            ))}

            {/* Creators section */}
            <div style={{
              padding: '0.5rem 1.25rem 0.25rem',
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--muted)',
              borderBottom: '1px solid var(--border)',
            }}>
              Creators
            </div>
            {sortedCreators.map(slug => (
              <button key={slug}
                onClick={() => { navigate(`/creator/${slug}`); closeHamburger(); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '0.75rem 1.25rem 0.75rem 1.75rem',
                  background: 'none', border: 'none', borderBottom: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: '0.95rem', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {CREATOR_DISPLAY[slug]}
              </button>
            ))}

            {/* Theme toggle at bottom */}
            <div style={{ padding: '0.875rem 1.25rem' }}>
              <button onClick={() => { toggleTheme(); closeHamburger(); }} style={{
                background: 'var(--bg-row-alt)', border: '1px solid var(--border)',
                borderRadius: '6px', color: 'var(--muted)', fontSize: '0.8rem',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                padding: '6px 14px',
              }}>
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
