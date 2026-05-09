import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '../hooks/useIsMobile';
import { useData } from '../hooks/useData';
import { eligiblePredictions } from '../hooks/useData';
import { useFilters } from '../hooks/useFilters';
import { applyFilters, getCreatorStats, ALL_CREATORS, CREATOR_DISPLAY, formatPct, getAccuracyColor } from '../utils/accuracy';
import type { Prediction, Event, Fight } from '../types';

const SITE_URL = 'https://octascore.xyz';
const OG_IMAGE = `${SITE_URL}/favicon.png`;

const CREATOR_BIO: Record<string, string> = {
  mma_joey: 'MMA Joey is known for a straightforward, fan-focused approach to UFC fight predictions that combines matchup analysis, betting instincts, and strong personal conviction. His prediction style often leans heavily on momentum, durability, cardio, and fighter confidence rather than purely technical breakdowns. Joey tends to trust proven veterans and fighters with reliable pressure or toughness, especially in chaotic matchups where intangibles matter. His content feels conversational and accessible, making viewers feel like they are discussing fights with another passionate MMA fan rather than watching a formal analyst.',
  mma_guru: 'MMA Guru has built his brand around highly confident UFC fight predictions, extensive event coverage, and aggressive takes on fighter trajectories and matchmaking. His prediction process blends stylistic analysis with narratives around activity, mentality, promotional favoritism, and championship composure. He is especially known for confidently calling upset picks and identifying fighters he believes are overrated or declining before public opinion fully shifts. Beyond the predictions themselves, much of his popularity comes from the entertainment factor and conviction behind his calls, which makes his wins and misses highly memorable within the MMA community.',
  the_weasel: 'The Weasel approaches fight prediction from a more technical and film-study-oriented perspective. His breakdowns focus heavily on striking mechanics, defensive habits, grappling transitions, cage control, pace management, and strategic tendencies shown in previous fights. Rather than relying on hype or narratives, he typically explains exactly why a stylistic matchup favors one fighter over another, often identifying subtle technical details that casual viewers may miss. His prediction content appeals strongly to fans who enjoy deeper tactical analysis and want to understand the strategic layers behind UFC outcomes.',
};

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isMobile = useIsMobile();

  const sortedCreators = useMemo(() =>
    ALL_CREATORS
      .filter(s => CREATOR_DISPLAY[s] && predictions.some(p => p.creator === s))
      .sort((a, b) => CREATOR_DISPLAY[a].localeCompare(CREATOR_DISPLAY[b])),
    [predictions]);

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

  const displayName = CREATOR_DISPLAY[creator] || creator;
  const pageUrl = `${SITE_URL}/creator/${creator}`;
  const description = !loading && stats.eligible > 0
    ? `${displayName}'s UFC prediction record: ${stats.correct}W-${stats.incorrect}L (${formatPct(stats.accuracy)} accuracy) across ${stats.eligible} eligible picks.`
    : `Track ${displayName}'s UFC fight prediction accuracy across all events and years on OctaScore.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${displayName} — UFC Fight Prediction Accuracy`,
    description,
    url: pageUrl,
    creator: { '@type': 'Organization', name: 'OctaScore', url: SITE_URL },
    about: { '@type': 'Person', name: displayName },
    ...(!loading && stats.eligible > 0 && {
      variableMeasured: [
        { '@type': 'PropertyValue', name: 'Prediction Accuracy', value: formatPct(stats.accuracy) },
        { '@type': 'PropertyValue', name: 'Correct Predictions', value: stats.correct },
        { '@type': 'PropertyValue', name: 'Incorrect Predictions', value: stats.incorrect },
        { '@type': 'PropertyValue', name: 'Eligible Picks', value: stats.eligible },
      ],
    }),
  };

  if (loading) return (
    <>
      <Helmet>
        <title>{`${displayName} Prediction Accuracy | OctaScore`}</title>
        <meta name="description" content={`Track ${displayName}'s UFC fight prediction accuracy across all events and years on OctaScore.`} />
        <meta property="og:title" content={`${displayName} Prediction Accuracy | OctaScore`} />
        <meta property="og:description" content={`Track ${displayName}'s UFC fight prediction accuracy across all events and years on OctaScore.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary" />
        <link rel="canonical" href={pageUrl} />
      </Helmet>
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
    </>
  );
  if (!CREATOR_DISPLAY[creator]) return <div style={{ padding: '2rem' }}>Creator not found.</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}>
      <Helmet>
        <title>{`${displayName} Prediction Accuracy | OctaScore`}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${displayName} Prediction Accuracy | OctaScore`} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${displayName} Prediction Accuracy | OctaScore`} />
        <meta name="twitter:description" content={description} />
        <link rel="canonical" href={pageUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      {/* Creator selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <div style={{ position: 'relative' }}>
          {dropdownOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setDropdownOpen(false)} />
          )}
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text)',
              padding: '0.4rem 0.875rem',
              fontSize: '0.82rem',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              outline: 'none',
            }}
          >
            {CREATOR_DISPLAY[creator]}
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1 }}>▾</span>
          </button>
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: 0,
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.25rem 0',
              minWidth: '180px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 200,
              overflow: 'hidden',
            }}>
              {sortedCreators.map(s => (
                <button
                  key={s}
                  onClick={() => { navigate(`/creator/${s}${window.location.search}`); setDropdownOpen(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 1rem',
                    background: s === creator ? 'var(--secondary)' : 'none',
                    border: 'none',
                    color: s === creator ? '#fff' : 'var(--text)',
                    fontSize: '0.82rem',
                    fontWeight: s === creator ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (s !== creator) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={e => { if (s !== creator) e.currentTarget.style.background = 'none'; }}
                >
                  {CREATOR_DISPLAY[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--logo-red)' }}>{CREATOR_DISPLAY[creator]}</h1>
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

      {CREATOR_BIO[creator] && (
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.88rem',
          lineHeight: 1.7,
          marginBottom: '1.5rem',
          maxWidth: '72ch',
        }}>
          {CREATOR_BIO[creator]}
        </p>
      )}

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
        const eventDateShort = new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return (
          <div key={event.event_id} style={{ marginBottom: '0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Event header */}
            <div
              onClick={() => toggleCollapse(event.event_id)}
              style={{
                padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
                background: 'var(--bg-row-alt)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              {isMobile ? (
                /* ── Mobile: two rows ── */
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{event.name}</span>
                    {/* CSS-rotated ▼ avoids the coloured emoji ▶ on iOS */}
                    <span style={{
                      display: 'inline-block',
                      transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                      color: 'var(--muted)',
                      fontSize: '0.75rem',
                      lineHeight: 1,
                      marginLeft: '0.5rem',
                      flexShrink: 0,
                    }}>▼</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{event.event_type === 'ppv' ? 'PPV' : 'Fight Night'}</span>
                      <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>•</span>
                      <span>{eventDateShort}</span>
                    </span>
                    {eventAcc !== null && (
                      <span style={{ color: getAccuracyColor(eventAcc), fontWeight: 700, fontSize: '0.78rem' }}>
                        {formatPct(eventAcc)} ({eventCorrect}/{eventElig.length})
                      </span>
                    )}
                  </div>
                </>
              ) : (
                /* ── Desktop: single row ── */
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{event.name}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '1.3rem', lineHeight: 1, opacity: 0.8 }}>•</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{eventDate}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '1.3rem', lineHeight: 1, opacity: 0.8 }}>•</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{event.event_type || 'Fight Night'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {eventAcc !== null && (
                      <span style={{ color: getAccuracyColor(eventAcc), fontWeight: 700, fontSize: '0.85rem' }}>
                        {formatPct(eventAcc)} ({eventCorrect}/{eventElig.length})
                      </span>
                    )}
                    <span style={{
                      display: 'inline-block',
                      transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                      color: 'var(--muted)',
                      fontSize: '0.8rem',
                      lineHeight: 1,
                    }}>▼</span>
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <table className="creator-detail-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[
                      { label: 'Fight' },
                      { label: 'Their Pick' },
                      { label: 'Result' },
                      { label: '', hide: true },
                    ].map(({ label, hide }, idx) => (
                      <th key={idx} className={hide ? 'mobile-hide' : ''} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preds.map((p, i) => {
                    const fight = event.fights.find(f => f.fight_id === p.fight_id);
                    const isEligible = p.correct !== null && p.predicted_winner !== null && !p.fight_skipped && (p.ambiguous !== true || p.manually_resolved === true);
                    const exclusionReason = !isEligible ? getExclusionReason(p, fight) : '';
                    const borderColor = !isEligible ? 'transparent' : p.correct ? 'var(--success)' : 'var(--danger)';
                    const rowBg = !isEligible ? 'transparent' : p.correct
                      ? 'rgba(0,214,143,0.07)'
                      : 'rgba(255,77,141,0.07)';

                    return (
                      <tr key={p.prediction_id} style={{
                        borderBottom: i < preds.length - 1 ? '1px solid var(--border)' : 'none',
                        background: rowBg,
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
                        <td className="mobile-hide" style={{ padding: '0.625rem 1rem', fontSize: '0.9rem', textAlign: 'right', paddingRight: '1rem' }}>
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
