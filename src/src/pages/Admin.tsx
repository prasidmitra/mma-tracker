import { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { ALL_CREATORS, CREATOR_DISPLAY } from '../utils/accuracy';
import type { Prediction, FlaggedPrediction } from '../types';

const PASS_HASH = '86beec3c13abe11fb1711a5111cf54d27867694027adf20deb7b0ba749165a42';
const REPO = 'prasidmitra/mma-tracker';

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function b64decode(b64: string): string {
  return decodeURIComponent(escape(atob(b64.replace(/\s/g, ''))));
}

function b64encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

async function ghGet(path: string, pat: string): Promise<{ content: string; sha: string }> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github.v3+json' },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} — ${await res.text()}`);
  return res.json();
}

async function ghPut(path: string, pat: string, data: unknown, sha: string, message: string) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, content: b64encode(JSON.stringify(data, null, 2)), sha }),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status} — ${await res.text()}`);
  return res.json();
}

type PredChange = { predicted_winner?: string | null; correct?: boolean | null; manually_resolved?: boolean };
type FlagChange = { manually_resolved: boolean; resolved_winner: string | null };

// ── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem',
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px',
  color: 'var(--text)', fontSize: '0.9rem', fontFamily: "'Manrope', sans-serif", outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '0.5rem 1.25rem', background: 'var(--primary)', border: 'none', borderRadius: '6px',
  color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
};

const btnMuted: React.CSSProperties = {
  ...btnPrimary, background: 'var(--row-alt)', color: 'var(--muted)',
};

const selectStyle: React.CSSProperties = {
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px',
  color: 'var(--text)', fontSize: '0.82rem', fontFamily: "'Manrope', sans-serif", padding: '3px 6px',
};

// ── Login screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [phase, setPhase] = useState<'password' | 'pat'>('password');
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [patInput, setPatInput] = useState('');

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    const hash = await sha256hex(passInput);
    if (hash === PASS_HASH) {
      setPhase('pat');
    } else {
      setPassError('Incorrect password');
    }
  }

  function handlePat(e: React.FormEvent) {
    e.preventDefault();
    if (!patInput.trim()) return;
    sessionStorage.setItem('admin_pat', patInput.trim());
    onSuccess();
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontFamily: "'Manrope', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '360px', padding: '2rem', background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--logo-red)', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>
          OctaScore Admin
        </div>

        {phase === 'password' ? (
          <form onSubmit={handlePassword}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
              Password
            </label>
            <input
              type="password"
              value={passInput}
              autoFocus
              onChange={e => { setPassInput(e.target.value); setPassError(''); }}
              style={inputStyle}
            />
            {passError && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>{passError}</div>}
            <button type="submit" style={{ ...btnPrimary, width: '100%', marginTop: '1rem' }}>Continue</button>
          </form>
        ) : (
          <form onSubmit={handlePat}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              value={patInput}
              placeholder="ghp_..."
              autoFocus
              onChange={e => setPatInput(e.target.value)}
              style={inputStyle}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
              Needs <code>repo</code> scope.{' '}
              <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ color: 'var(--highlight)' }}>Create token ↗</a>
              <br />Stored in sessionStorage only — cleared on tab close.
            </div>
            <button type="submit" disabled={!patInput.trim()} style={{ ...btnPrimary, width: '100%', marginTop: '1rem', opacity: patInput.trim() ? 1 : 0.5 }}>
              Enter Admin
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main admin ────────────────────────────────────────────────────────────────

export function Admin() {
  const [authed, setAuthed] = useState(() =>
    typeof window !== 'undefined' && !!sessionStorage.getItem('admin_pat')
  );

  const { events, predictions, flagged } = useData();

  // Filters
  const [filterCreator, setFilterCreator] = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false);

  // Change tracking
  const [predChanges, setPredChanges] = useState<Record<string, PredChange>>({});
  const [flagChanges, setFlagChanges] = useState<Record<string, FlagChange>>({});

  // Inline editing
  const [editingCell, setEditingCell] = useState<{ predId: string; field: string } | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const flagLookup = useMemo(() => {
    const m = new Map<string, FlaggedPrediction>();
    flagged.forEach(f => m.set(`${f.creator}|${f.event_id}|${f.fight_id}`, f));
    return m;
  }, [flagged]);

  const eventMap = useMemo(() => new Map(events.map(e => [e.event_id, e])), [events]);

  const sortedEvents = useMemo(() =>
    [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [events]
  );

  const filtered = useMemo(() => predictions.filter(p => {
    if (filterCreator !== 'all' && p.creator !== filterCreator) return false;
    if (filterEvent !== 'all' && p.event_id !== filterEvent) return false;
    if (showFlaggedOnly && !p.ambiguous) return false;
    if (showUnresolvedOnly && (!p.ambiguous || p.manually_resolved)) return false;
    return true;
  }), [predictions, filterCreator, filterEvent, showFlaggedOnly, showUnresolvedOnly]);

  function applyPredChange(predId: string, field: keyof PredChange, value: unknown) {
    setPredChanges(prev => ({ ...prev, [predId]: { ...prev[predId], [field]: value } }));
    setSaveResult(null);
  }

  function applyFlagChange(flagId: string, change: FlagChange) {
    setFlagChanges(prev => ({ ...prev, [flagId]: change }));
    setSaveResult(null);
  }

  const totalChanges = Object.keys(predChanges).length + Object.keys(flagChanges).length;

  async function handleSave() {
    const pat = sessionStorage.getItem('admin_pat');
    if (!pat) { setAuthed(false); return; }

    setSaving(true);
    setSaveResult(null);

    try {
      // Group pred changes by creator
      const byCreator: Record<string, string[]> = {};
      for (const predId of Object.keys(predChanges)) {
        const pred = predictions.find(p => p.prediction_id === predId);
        if (!pred) continue;
        (byCreator[pred.creator] ||= []).push(predId);
      }

      let totalUpdated = 0;
      for (const [creator, predIds] of Object.entries(byCreator)) {
        const path = `data/predictions/${creator}.json`;
        const { content, sha } = await ghGet(path, pat);
        const preds: Prediction[] = JSON.parse(b64decode(content));
        for (const predId of predIds) {
          const idx = preds.findIndex(p => p.prediction_id === predId);
          if (idx !== -1) { Object.assign(preds[idx], predChanges[predId]); totalUpdated++; }
        }
        await ghPut(path, pat, preds, sha,
          `Admin correction: ${predIds.length} prediction${predIds.length !== 1 ? 's' : ''} updated`);
      }

      if (Object.keys(flagChanges).length > 0) {
        const path = 'data/flagged.json';
        const { content, sha } = await ghGet(path, pat);
        const flags: FlaggedPrediction[] = JSON.parse(b64decode(content));
        for (const [flagId, change] of Object.entries(flagChanges)) {
          const idx = flags.findIndex(f => f.flag_id === flagId);
          if (idx !== -1) Object.assign(flags[idx], change);
        }
        const n = Object.keys(flagChanges).length;
        await ghPut(path, pat, flags, sha,
          `Admin correction: ${n} flag${n !== 1 ? 's' : ''} resolved`);
      }

      setPredChanges({});
      setFlagChanges({});
      setEditingCell(null);
      setSaveResult({ ok: true, msg: `Saved ${totalUpdated} prediction${totalUpdated !== 1 ? 's' : ''} — GitHub Actions will rebuild the site.` });
    } catch (err) {
      setSaveResult({ ok: false, msg: String(err) });
    } finally {
      setSaving(false);
    }
  }

  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Manrope', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--logo-red)', letterSpacing: '-0.01em' }}>OctaScore Admin</span>
        <button onClick={() => { sessionStorage.removeItem('admin_pat'); setAuthed(false); }} style={btnMuted}>
          Log out
        </button>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', maxWidth: '1500px', margin: '0 auto' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem', background: 'var(--panel)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <select value={filterCreator} onChange={e => setFilterCreator(e.target.value)} style={selectStyle}>
            <option value="all">All Creators</option>
            {ALL_CREATORS.map(s => <option key={s} value={s}>{CREATOR_DISPLAY[s]}</option>)}
          </select>

          <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} style={selectStyle}>
            <option value="all">All Events</option>
            {sortedEvents.map(e => <option key={e.event_id} value={e.event_id}>{e.name}</option>)}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showFlaggedOnly} onChange={e => setShowFlaggedOnly(e.target.checked)} />
            Flagged only
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showUnresolvedOnly} onChange={e => setShowUnresolvedOnly(e.target.checked)} />
            Unresolved only
          </label>

          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--muted)' }}>
            {filtered.length} prediction{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--panel)', borderRadius: '8px', border: '1px solid var(--border)', overflowX: 'auto', marginBottom: '80px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Creator', 'Event', 'Fight', 'Predicted Winner', 'Correct', 'Flagged', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.875rem', textAlign: 'left', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const event = eventMap.get(p.event_id);
                const fight = event?.fights.find(f => f.fight_id === p.fight_id);
                const flag = flagLookup.get(`${p.creator}|${p.event_id}|${p.fight_id}`);
                const changes = predChanges[p.prediction_id] ?? {};
                const flagChange = flag ? (flagChanges[flag.flag_id] ?? null) : null;

                const currentPW = 'predicted_winner' in changes ? changes.predicted_winner : p.predicted_winner;
                const currentCorrect = 'correct' in changes ? changes.correct : p.correct;
                const pwChanged = 'predicted_winner' in changes;
                const correctChanged = 'correct' in changes;

                const isEditPW = editingCell?.predId === p.prediction_id && editingCell.field === 'pw';
                const isEditCorrect = editingCell?.predId === p.prediction_id && editingCell.field === 'correct';

                return (
                  <tr key={p.prediction_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Creator */}
                    <td style={{ padding: '0.5rem 0.875rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {CREATOR_DISPLAY[p.creator]}
                    </td>

                    {/* Event */}
                    <td style={{ padding: '0.5rem 0.875rem', whiteSpace: 'nowrap' }}>
                      {event?.name ?? p.event_id}
                    </td>

                    {/* Fight */}
                    <td style={{ padding: '0.5rem 0.875rem', whiteSpace: 'nowrap' }}>
                      {fight ? `${fight.fighter_a} vs ${fight.fighter_b}` : p.fight_id}
                    </td>

                    {/* Predicted Winner — click to edit */}
                    <td
                      style={{ padding: '0.5rem 0.875rem', background: pwChanged ? 'rgba(250,204,21,0.12)' : 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onClick={() => !isEditPW && setEditingCell({ predId: p.prediction_id, field: 'pw' })}
                    >
                      {isEditPW ? (
                        <select
                          autoFocus
                          value={currentPW ?? '__null__'}
                          style={selectStyle}
                          onChange={e => {
                            applyPredChange(p.prediction_id, 'predicted_winner', e.target.value === '__null__' ? null : e.target.value);
                            setEditingCell(null);
                          }}
                          onBlur={() => setEditingCell(null)}
                        >
                          <option value="__null__">null (pick'em)</option>
                          {fight && <>
                            <option value={fight.fighter_a}>{fight.fighter_a}</option>
                            <option value={fight.fighter_b}>{fight.fighter_b}</option>
                          </>}
                        </select>
                      ) : (
                        <span style={{ color: currentPW ? 'var(--text)' : 'var(--muted)', fontStyle: currentPW ? 'normal' : 'italic' }}>
                          {currentPW ?? 'null'} {pwChanged && <span style={{ fontSize: '0.7rem', color: 'var(--gold-primary)' }}>✎</span>}
                        </span>
                      )}
                    </td>

                    {/* Correct — click to edit */}
                    <td
                      style={{ padding: '0.5rem 0.875rem', background: correctChanged ? 'rgba(250,204,21,0.12)' : 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onClick={() => !isEditCorrect && setEditingCell({ predId: p.prediction_id, field: 'correct' })}
                    >
                      {isEditCorrect ? (
                        <select
                          autoFocus
                          value={currentCorrect === null ? '__null__' : String(currentCorrect)}
                          style={selectStyle}
                          onChange={e => {
                            const v = e.target.value === '__null__' ? null : e.target.value === 'true';
                            applyPredChange(p.prediction_id, 'correct', v);
                            setEditingCell(null);
                          }}
                          onBlur={() => setEditingCell(null)}
                        >
                          <option value="__null__">null</option>
                          <option value="true">✓ true</option>
                          <option value="false">✗ false</option>
                        </select>
                      ) : (
                        <span style={{ color: currentCorrect === true ? 'var(--accent-green)' : currentCorrect === false ? 'var(--accent-red)' : 'var(--muted)', fontWeight: currentCorrect !== null ? 700 : 400, fontStyle: currentCorrect === null ? 'italic' : 'normal' }}>
                          {currentCorrect === true ? '✓' : currentCorrect === false ? '✗' : 'null'} {correctChanged && <span style={{ fontSize: '0.7rem', color: 'var(--gold-primary)' }}>✎</span>}
                        </span>
                      )}
                    </td>

                    {/* Flagged */}
                    <td style={{ padding: '0.5rem 0.875rem', minWidth: '220px' }}>
                      {p.ambiguous && flag ? (
                        <div>
                          <div
                            title={flag.ambiguity_reason}
                            style={{ color: 'var(--gold-primary)', fontSize: '0.78rem', marginBottom: '0.3rem', cursor: 'help' }}
                          >
                            ⚑ <span style={{ textDecoration: 'underline dotted' }}>
                              {flag.ambiguity_reason.length > 45 ? flag.ambiguity_reason.slice(0, 45) + '…' : flag.ambiguity_reason}
                            </span>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={flagChange?.manually_resolved ?? flag.manually_resolved}
                              onChange={e => applyFlagChange(flag.flag_id, {
                                manually_resolved: e.target.checked,
                                resolved_winner: flagChange?.resolved_winner ?? flag.resolved_winner,
                              })}
                            />
                            Mark resolved
                          </label>
                          {(flagChange?.manually_resolved ?? flag.manually_resolved) && (
                            <input
                              type="text"
                              placeholder="Resolved winner name"
                              value={flagChange?.resolved_winner ?? flag.resolved_winner ?? ''}
                              onChange={e => applyFlagChange(flag.flag_id, {
                                manually_resolved: true,
                                resolved_winner: e.target.value || null,
                              })}
                              style={{ ...inputStyle, fontSize: '0.78rem', padding: '3px 8px', marginTop: '0.3rem', width: '180px' }}
                            />
                          )}
                        </div>
                      ) : p.ambiguous ? (
                        <span style={{ color: 'var(--gold-primary)', fontSize: '0.78rem' }}>⚑ no flag record</span>
                      ) : (
                        <span style={{ color: 'var(--border)' }}>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.5rem 0.875rem', whiteSpace: 'nowrap' }}>
                      {p.video_id ? (
                        <a
                          href={`https://youtube.com/watch?v=${p.video_id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--highlight)', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}
                        >
                          View Video ↗
                        </a>
                      ) : (
                        <span style={{ color: 'var(--border)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
              No predictions match the current filters.
            </div>
          )}
        </div>
      </div>

      {/* Sticky save bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--panel)', borderTop: '1px solid var(--border)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 100 }}>
        <button
          onClick={handleSave}
          disabled={saving || totalChanges === 0}
          style={{ ...btnPrimary, opacity: totalChanges === 0 || saving ? 0.5 : 1 }}
        >
          {saving ? 'Saving…' : totalChanges > 0 ? `Save ${totalChanges} change${totalChanges !== 1 ? 's' : ''}` : 'Save'}
        </button>

        {totalChanges > 0 && !saving && (
          <button onClick={() => { setPredChanges({}); setFlagChanges({}); setSaveResult(null); }} style={btnMuted}>
            Discard
          </button>
        )}

        {saveResult ? (
          <span style={{ fontSize: '0.85rem', color: saveResult.ok ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {saveResult.ok ? '✓ ' : '✗ '}{saveResult.msg}
            {saveResult.ok && <>{' — '}<a href="https://github.com/prasidmitra/mma-tracker/actions" target="_blank" rel="noreferrer" style={{ color: 'var(--highlight)' }}>View Actions ↗</a></>}
          </span>
        ) : totalChanges === 0 ? (
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>No unsaved changes</span>
        ) : null}
      </div>
    </div>
  );
}
