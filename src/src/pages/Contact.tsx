import { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/Navbar';
import { ALL_CREATORS, CREATOR_DISPLAY } from '../utils/accuracy';
import { useData } from '../hooks/useData';

const FORM_URL = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSdkGp9_yQMWChHBp_3LGRmBI0rdTCyWo-Le33LlYNYPt6nmFw/formResponse';

const TYPES = ['Suggestion', 'Report an Error', 'Other'];

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: 'var(--text-secondary)',
  marginBottom: '0.375rem',
};

const fieldBoxStyle: React.CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '0.9rem',
  fontFamily: "'Manrope', sans-serif",
};

function CustomDropdown({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          ...fieldBoxStyle,
          width: '100%',
          padding: '0.6rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          border: '1px solid var(--border)',
          textAlign: 'left',
          outline: 'none',
        }}
      >
        <span style={{ color: value ? 'var(--text)' : 'var(--muted)' }}>{value || placeholder}</span>
        <span style={{
          fontSize: '0.8rem',
          color: 'var(--muted)',
          display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
          lineHeight: 1,
          flexShrink: 0,
        }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '0.25rem 0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 200,
          overflow: 'hidden',
        }}>
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 1rem',
                background: opt === value ? 'var(--secondary)' : 'none',
                border: 'none',
                color: opt === value ? '#fff' : 'var(--text)',
                fontSize: '0.9rem',
                fontWeight: opt === value ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = 'var(--hover-overlay)'; }}
              onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'none'; }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Contact() {
  const [type, setType] = useState('');
  const [creator, setCreator] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { predictions } = useData();
  const creatorOptions = [
    'Not applicable',
    ...ALL_CREATORS
      .filter(slug => predictions.some(p => p.creator === slug))
      .map(s => CREATOR_DISPLAY[s]),
  ];

  const validateEmail = (val: string) => {
    if (!val) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? '' : 'Invalid email address';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    if (!type || !message.trim()) return;

    setSubmitting(true);
    const body = new URLSearchParams({
      'entry.96150974': type,
      'entry.321243936': message,
      ...(email ? { 'entry.144105628': email } : {}),
      ...(creator && creator !== 'Not applicable' ? { 'entry.763118966': creator } : {}),
    });

    try {
      await fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body });
    } catch {
      // no-cors always throws on response read; submission still goes through
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <>
      <Helmet>
        <title>Contact Us — OctaScore</title>
        <meta name="description" content="Send a suggestion or report an error on OctaScore." />
      </Helmet>
      <Navbar />
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--logo-red)', textShadow: '0 0 40px rgba(245, 197, 66, 0.18)', marginBottom: '0.5rem' }}>
          Contact Us
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Have a suggestion or spotted a prediction error? Let us know.
        </p>

        {submitted ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '2.5rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Message sent!</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Thanks for reaching out. We'll look into it.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div>
              <label style={labelStyle}>Type <span style={{ color: 'var(--accent-red)' }}>*</span></label>
              <CustomDropdown
                value={type}
                options={TYPES}
                placeholder="Select a type..."
                onChange={setType}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Creator{' '}
                <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <CustomDropdown
                value={creator}
                options={creatorOptions}
                placeholder="Not applicable"
                onChange={setCreator}
              />
            </div>

            <div>
              <label style={labelStyle}>Message <span style={{ color: 'var(--accent-red)' }}>*</span></label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your suggestion or the issue you found..."
                style={{
                  ...fieldBoxStyle,
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  resize: 'vertical',
                  lineHeight: 1.6,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Email{' '}
                <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — if you'd like a reply)</span>
              </label>
              <input
                type="text"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(validateEmail(e.target.value)); }}
                onBlur={() => setEmailError(validateEmail(email))}
                placeholder="you@example.com"
                style={{
                  ...fieldBoxStyle,
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  borderColor: emailError ? 'var(--accent-red)' : undefined,
                }}
              />
              {emailError && (
                <div style={{ color: 'var(--accent-red)', fontSize: '0.75rem', marginTop: '0.3rem' }}>{emailError}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !type || !message.trim() || !!emailError}
              style={{
                padding: '0.7rem 1.5rem',
                background: 'var(--accent-purple)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                fontFamily: "'Manrope', sans-serif",
                cursor: submitting || !type || !message.trim() || !!emailError ? 'not-allowed' : 'pointer',
                opacity: submitting || !type || !message.trim() || !!emailError ? 0.6 : 1,
                transition: 'opacity 0.15s',
                alignSelf: 'flex-start',
              }}
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
