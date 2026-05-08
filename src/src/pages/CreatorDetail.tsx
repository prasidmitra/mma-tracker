import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { eligiblePredictions } from '../hooks/useData';
import { useFilters } from '../hooks/useFilters';
import { applyFilters, getCreatorStats, ALL_CREATORS, CREATOR_DISPLAY, formatPct, getAccuracyColor } from '../utils/accuracy';
import type { Prediction, Event, Fight } from '../types';

const CARD_ORDER: Record<string, number> = {
  main_event: 0,
  co_main: 1,
  main_card: 2,
  prelim: 3,
  early_prelim: 4,
};

function sortPredsByFightOrder(preds: Prediction[], event: Event): Prediction[] {
  return [...preds].sort((a, b) => {
    const fa = event.fights.find(f => f.fight_id === a.fight_id);
    const fb = event.fights.find(f => f.fight_id === b.fight_id);
    const oa = fa ? (CARD_ORDER[fa.card_position] ?? 99) : 99;
    const ob = fb ? (CARD_ORDER[fb.card_position] ?? 99) : 99;
    return oa - ob;
  });
}

function getExclusionReason(p: Prediction, fight: Fight | undefined): string {
  if (!fight) return 'Fight not found';
  if (fight.winner === null) return 'Cancelled / No Contest';
  if (p.fight_skipped) return 'Skipped';
  if (p.predicted_winner === null) return "Pick 'em";
  if (p.ambiguous && !p.manually_resolved) return 'Pending review';
  return '';
}

export function CreatorDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { events, predictions, loading } = useData();
  const [filters] = useFilters();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const creator = slug || '';
  const filtered = useMemo(() =>
    applyFilters(predictions.filter(p => p.creator === creator), events, filters),
    [predictions, events, filters, creator]
  );

  const stats = useMemo(() => getCreatorStats(creator, predictions, events, filters), [creator, predictions, events, filters]);

  const eventGroups = useMemo(() => {
    const evMap = new Map<string, { event: Event; preds: Prediction[] }>();
    filtered.forEach(p => {
      const event = events.find(e => e.event_id === p.event_id);
      if (!event) return;
      if (!evMap.has(p.event_id)) evMap.set(p.event_id, { event, preds: [] });
      evMap.get(p.event_id)!.preds.push(p);
    });
    return Array.from(evMap.values()).sort((a, b) =>
      new Date(b.event.date).getTime() - new Date(a.event.date).getTime()
    );
  }, [filtered, events]);

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;
  if (!CREATOR_DISPLAY[creator]) return <div style={{ padding: '2rem' }}>Creator not found.</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Creator selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <select
          value={creator}
          onChange={e => navigate(`/creator/${e.target.value}${window.location.search}`)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            padding: '0.375rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {ALL_CREATORS.filter(s => CREATOR_DISPLAY[s]).map(s => (
            <option key={s} value={s}>{CREATOR_DISPLAY[s]}</option>
          ))}
        </select>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>{CREATOR_DISPLAY[creator]}</h1>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'baseline' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: getAccuracyColor(stats.accuracy), lineHeight: 1 }}>
            {formatPct(stats.accuracy)}
          </span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--accent-green)' }}>{stats.correct}</span>
              <span style={{ color: 'var(--text-secondary)' }}> - </span>
              <span style={{ color: 'var(--accent-red)' }}>{stats.incorrect}</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{stats.eligible} eligible picks</div>
          </div>
        </div>
      </div>

      {eventGroups.length === 0 && (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No predictions for selected filters.</div>
      )}

      {/* Event groups */}
      {eventGroups.map(({ event, preds: rawPreds }) => {
        const preds = sortPredsByFightOrder(rawPreds, event);
        const isCollapsed = collapsed.has(event.event_id);
        const eventElig = eligiblePredictions(preds);
        const eventCorrect = eventElig.filter(p => p.correct).length;
        const eventAcc = eventElig.length > 0 ? eventCorrect / eventElig.length : null;
        const eventDate = new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        return (
          <div key={event.event_id} style={{ marginBottom: '0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Event header */}
            <div
              onClick={() => toggleCollapse(event.event_id)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                background: 'var(--bg-row-alt)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{event.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>·</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{eventDate}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>·</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{event.event_type || 'Fight Night'}</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {eventAcc !== null && (
                  <span style={{ color: getAccuracyColor(eventAcc), fontWeight: 700, fontSize: '0.85rem' }}>
                    {formatPct(eventAcc)} ({eventCorrect}/{eventElig.length})
                  </span>
                )}
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{isCollapsed ? '▶' : '▼'}</span>
              </div>
            </div>

            {!isCollapsed && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Fight', 'Their Pick', 'Result', ''].map((h, idx) => (
                      <th key={idx} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preds.map((p, i) => {
                    const fight = event.fights.find(f => f.fight_id === p.fight_id);
                    const isEligible = p.correct !== null && p.predicted_winner !== null && !p.fight_skipped && (p.ambiguous !== true || p.manually_resolved === true);
                    const exclusionReason = !isEligible ? getExclusionReason(p, fight) : '';
                    const borderColor = !isEligible ? 'transparent' : p.correct ? 'var(--accent-purple)' : 'var(--accent-red)';
                    const rowBg = !isEligible ? 'transparent' : p.correct
                      ? 'rgba(154,107,204,0.08)'
                      : 'rgba(248,81,73,0.05)';

                    return (
                      <tr key={p.prediction_id} style={{
                        borderBottom: i < preds.length - 1 ? '1px solid var(--border)' : 'none',
                        background: i % 2 === 1 ? `color-mix(in srgb, var(--bg-row-alt) 50%, ${rowBg})` : rowBg,
                        borderLeft: `3px solid ${borderColor}`,
                        opacity: isEligible ? 1 : 0.6,
                      }}>
                        <td style={{ padding: '0.625rem 1rem', fontStyle: isEligible ? 'normal' : 'italic', fontSize: '0.85rem' }}>
                          {fight ? `${fight.fighter_a} vs ${fight.fighter_b}` : p.fight_id}
                        </td>
                        <td style={{ padding: '0.625rem 1rem', fontWeight: 600, fontSize: '0.85rem', color: isEligible ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {p.predicted_winner || <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>—</span>}
                        </td>
                        <td style={{ padding: '0.625rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {fight?.winner || '—'}
                        </td>
                        <td style={{ padding: '0.625rem 1rem', fontSize: '0.9rem', textAlign: 'right', paddingRight: '1rem' }}>
                          {isEligible
                            ? <span style={{ fontWeight: 700, color: p.correct ? 'var(--accent-green)' : 'var(--accent-red)' }}>{p.correct ? '✓' : '✗'}</span>
                            : <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{exclusionReason}</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
