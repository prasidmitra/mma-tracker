import { useMemo, useState } from 'react';
import { useData } from '../hooks/useData';
import { useFilters } from '../hooks/useFilters';
import { useIsMobile } from '../hooks/useIsMobile';
import { useFilterDrawer } from '../components/Layout';
import { applyFilters, ALL_CREATORS, CREATOR_DISPLAY } from '../utils/accuracy';
import type { Event, Fight } from '../types';

const CARD_ORDER: Record<string, number> = {
  main_event: 0,
  co_main: 1,
  main_card: 2,
  prelim: 3,
  early_prelim: 4,
};

export function Compare() {
  const { events, predictions, loading } = useData();
  const [filters] = useFilters();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();
  const { openDrawer } = useFilterDrawer();

  const activeCreators = useMemo(() =>
    ALL_CREATORS.filter(s => predictions.some(p => p.creator === s)),
    [predictions]
  );

  const filtered = useMemo(() =>
    applyFilters(predictions, events, filters),
    [predictions, events, filters]
  );

  // Lookup: "creator|fight_id" -> prediction
  const predLookup = useMemo(() => {
    const m = new Map<string, typeof predictions[0]>();
    filtered.forEach(p => m.set(`${p.creator}|${p.fight_id}`, p));
    return m;
  }, [filtered]);

  // Event groups: events that have any filtered predictions
  const eventGroups = useMemo(() => {
    const evMap = new Map<string, { event: Event; fightIds: Set<string> }>();
    filtered.forEach(p => {
      const event = events.find(e => e.event_id === p.event_id);
      if (!event) return;
      if (!evMap.has(p.event_id)) evMap.set(p.event_id, { event, fightIds: new Set() });
      evMap.get(p.event_id)!.fightIds.add(p.fight_id);
    });
    return Array.from(evMap.values())
      .sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime())
      .map(({ event, fightIds }) => {
        const fights: Fight[] = Array.from(fightIds)
          .map(fid => event.fights.find(f => f.fight_id === fid))
          .filter((f): f is Fight => !!f)
          .sort((a, b) => (CARD_ORDER[a.card_position] ?? 99) - (CARD_ORDER[b.card_position] ?? 99));
        return { event, fights };
      });
  }, [filtered, events]);

  const toggleCollapse = (id: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div className="page-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="leaderboard-heading" style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--logo-red)', textShadow: '0 0 40px rgba(245, 197, 66, 0.18)' }}>
            Compare
          </h2>
          {isMobile && (
            <button
              onClick={openDrawer}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600,
                fontFamily: "'Manrope', sans-serif", padding: '0.3rem 0.7rem',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              <svg width="13" height="11" viewBox="0 0 14 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M0 1h14M2.5 6h9M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Filters
            </button>
          )}
        </div>
      </div>

      {eventGroups.length === 0 && (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>
          No predictions for selected filters.
        </div>
      )}

      {eventGroups.map(({ event, fights }) => {
        const isCollapsed = collapsed.has(event.event_id);
        const eventDate = new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const eventDateShort = new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return (
          <div key={event.event_id} style={{ marginBottom: '0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Event header */}
            <div
              onClick={() => toggleCollapse(event.event_id)}
              style={{ padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem', background: 'var(--bg-row-alt)', cursor: 'pointer', userSelect: 'none' }}
            >
              {isMobile ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{event.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{eventDateShort}</span>
                    <span style={{ display: 'inline-block', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', color: 'var(--muted)', fontSize: '0.75rem', lineHeight: 1 }}>▼</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{event.name}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '1.3rem', lineHeight: 1, opacity: 0.8 }}>•</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{eventDate}</span>
                  </div>
                  <span style={{ display: 'inline-block', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1 }}>▼</span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: `${300 + activeCreators.length * 80}px` }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={thStyle}>Fight</th>
                      <th style={thStyle}>Result</th>
                      {activeCreators.map(slug => (
                        <th key={slug} style={{ ...thStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {CREATOR_DISPLAY[slug]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fights.map((fight, i) => (
                      <tr key={fight.fight_id} style={{ borderBottom: i < fights.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ ...tdStyle, fontSize: '0.83rem' }}>
                          {fight.fighter_a} vs {fight.fighter_b}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {fight.winner ?? '—'}
                        </td>
                        {activeCreators.map(slug => {
                          const pred = predLookup.get(`${slug}|${fight.fight_id}`);
                          const eligible = pred && pred.correct !== null && pred.predicted_winner !== null && !pred.fight_skipped && (pred.ambiguous !== true || pred.manually_resolved === true);
                          return (
                            <td key={slug} style={{ ...tdStyle, textAlign: 'center' }}>
                              {eligible
                                ? <span style={{ fontWeight: 700, fontSize: '0.9rem', color: pred!.correct ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                    {pred!.correct ? '✓' : '✗'}
                                  </span>
                                : <span style={{ color: 'var(--border)' }}>—</span>
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  textAlign: 'left',
  fontSize: '0.68rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.875rem',
};
