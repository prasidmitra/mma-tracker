import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', textDecoration: 'none' }}>
        MMA Prediction Tracker
      </Link>
      <a href="https://github.com/prasidmitra/mma-tracker" target="_blank" rel="noreferrer"
        style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>
        GitHub
      </a>
    </nav>
  );
}
