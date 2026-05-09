import { useState, useRef } from 'react';

const TOOLTIP_TEXT = "Accuracy you'd get by always picking the betting odds favorite for every fight";

export function InfoTooltip({ text = TOOLTIP_TEXT }: { text?: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.top - 6, left: r.left + r.width / 2 });
  };

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help', marginLeft: '0.2rem', verticalAlign: 'middle' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setPos(null)}
    >
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7v4M8 4.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {pos && (
        <span style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          transform: 'translate(-50%, -100%)',
          background: '#1e1e2e',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '0.4rem 0.7rem',
          fontSize: '0.8rem',
          color: '#fff',
          whiteSpace: 'nowrap',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}
