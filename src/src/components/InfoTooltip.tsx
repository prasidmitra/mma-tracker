import { useState } from 'react';

const TOOLTIP_TEXT = "Accuracy you'd get by always picking the betting odds favorite for every fight";

export function InfoTooltip({ text = TOOLTIP_TEXT }: { text?: string }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help', marginLeft: '0.2rem', verticalAlign: 'middle' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7v4M8 4.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {show && (
        <span style={{
          position: 'absolute',
          bottom: '130%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '0.35rem 0.6rem',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          zIndex: 20,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}
