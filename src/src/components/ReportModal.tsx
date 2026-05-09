import { useState } from 'react';
import { CREATOR_DISPLAY } from '../utils/accuracy';
import type { Prediction, Event, Fight } from '../types';

const FORM_URL = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSf7kX9jIH9INe_MJFDYTTGwlNz0zCcnxrnPRhpLZxbtp00DKQ/formResponse';

const REASONS = [
  'Wrong predicted winner',
  'Wrong actual result',
  "Fight shouldn't be here",
  "Prediction was a pick'em not a clear pick",
  'Other',
];

interface Props {
  prediction: Prediction;
  event: Event;
  fight: Fight | undefined;
  onClose: () => void;
}

export function ReportModal({ prediction, event, fight, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [reasonOpen, setReasonOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const creatorName = CREATOR_DISPLAY[prediction.creator] || prediction.creator;
  const fightName = fight ? `${fight.fighter_a} vs ${fight.fighter_b}` : prediction.fight_id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) { setReasonError('Please select a reason'); return; }

    const fd = new FormData();
    fd.append('entry.752930018', creatorName);
    fd.append('entry.852269768', event.name);
    fd.append('entry.1570155931', fightName);
    fd.append('entry.967305642', prediction.fight_id);
    fd.append('entry.2047943199', prediction.prediction_id);
    fd.append('entry.866802608', notes);
    fd.append('entry.369214997', reason);

    await fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body: fd });

    setSubmitted(true);
    setTimeout(onClose, 2000);
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', fontWeight: 700,
    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem',
  };

  const fieldBase: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '6px', color: 'var(--text)', fontSize: '0.875rem',
    fontFamily: "'Manrope', sans-serif", outline: 'none',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'var(--overlay-dark)', zIndex: 1000, animation: 'octaModalIn 0.18s ease' }}
      />

      {/* Modal — outer div only handles centering, inner div handles animation */}
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, width: '100%', maxWidth: '440px', padding: '0 1rem' }}>
        <div style={{ animation: 'octaModalIn 0.18s ease' }}>
        <div style={{ background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text)' }}>
            Report a Data Issue
          </h2>

          {/* Read-only context */}
          <div style={{ background: 'var(--bg)', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {[
              { label: 'Creator', value: creatorName },
              { label: 'Event', value: event.name },
              { label: 'Fight', value: fightName },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.83rem' }}>
                <span style={{ color: 'var(--muted)', minWidth: '54px', flexShrink: 0 }}>{label}</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          {submitted ? (
            <div style={{ color: 'var(--accent-green)', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', padding: '1.25rem 0' }}>
              ✓ Thank you — your report has been submitted
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Reason — custom dropdown */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>
                  What's wrong? <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  {reasonOpen && (
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                      onClick={() => setReasonOpen(false)}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setReasonOpen(o => !o)}
                    style={{
                      ...fieldBase,
                      border: `1px solid ${reasonError ? 'var(--danger)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', textAlign: 'left',
                      color: reason ? 'var(--text)' : 'var(--muted)',
                    }}
                  >
                    <span>{reason || 'Select a reason…'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '0.5rem', flexShrink: 0 }}>▾</span>
                  </button>
                  {reasonOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: 'var(--panel)', border: '1px solid var(--border)',
                      borderRadius: '8px', overflow: 'hidden',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 11,
                    }}>
                      {REASONS.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => { setReason(r); setReasonOpen(false); setReasonError(''); }}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '0.6rem 0.875rem', background: r === reason ? 'var(--secondary)' : 'none',
                            border: 'none', color: r === reason ? '#fff' : 'var(--text)',
                            fontSize: '0.875rem', fontFamily: "'Manrope', sans-serif",
                            fontWeight: r === reason ? 600 : 400, cursor: 'pointer',
                          }}
                          onMouseEnter={e => { if (r !== reason) e.currentTarget.style.background = 'var(--hover-overlay-subtle)'; }}
                          onMouseLeave={e => { if (r !== reason) e.currentTarget.style.background = 'none'; }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {reasonError && <div style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.3rem' }}>{reasonError}</div>}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>
                  Additional notes{' '}
                  <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value.slice(0, 200))}
                  rows={3}
                  placeholder="Any extra context…"
                  style={{
                    ...fieldBase,
                    resize: 'vertical', lineHeight: 1.6,
                    colorScheme: 'dark',
                  }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'right', marginTop: '0.2rem' }}>
                  {notes.length} / 200
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ padding: '0.5rem 1rem', background: 'var(--row-alt)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Manrope', sans-serif" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: 'var(--primary)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Manrope', sans-serif" }}
                >
                  Submit
                </button>
              </div>
            </form>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
