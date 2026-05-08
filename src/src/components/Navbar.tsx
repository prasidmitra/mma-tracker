import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ALL_CREATORS, CREATOR_DISPLAY } from '../utils/accuracy';
import logo from '../assets/logo.png';

const LOGO_HEIGHT = 48;

const sortedCreators = [...ALL_CREATORS].sort((a, b) =>
  CREATOR_DISPLAY[a].localeCompare(CREATOR_DISPLAY[b])
);

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
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
      <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <img src={logo} alt="OctaScore" style={{ height: `${LOGO_HEIGHT}px`, width: 'auto', display: 'block' }} />
      </Link>

      {/* Center nav links */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>

        {/* Home */}
        <Link to="/" style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          fontWeight: 600,
          textDecoration: 'none',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          Home
        </Link>

        {/* About */}
        <Link to="/about" style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          fontWeight: 600,
          textDecoration: 'none',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          About
        </Link>

        {/* Creators dropdown */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <button style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 0',
          }}>
            Creators <span style={{ fontSize: '0.65rem' }}>▾</span>
          </button>
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.375rem 0',
              minWidth: '180px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              zIndex: 200,
            }}>
              {sortedCreators.map(slug => (
                <button
                  key={slug}
                  onClick={() => { navigate(`/creator/${slug}`); setDropdownOpen(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 1rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-row-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {CREATOR_DISPLAY[slug]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>{/* end center nav links */}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-row-alt)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '4px 10px',
            transition: 'all 0.15s ease',
          }}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <a href="https://github.com/prasidmitra/mma-tracker" target="_blank" rel="noreferrer"
          style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>
          GitHub
        </a>
      </div>
    </nav>
  );
}
