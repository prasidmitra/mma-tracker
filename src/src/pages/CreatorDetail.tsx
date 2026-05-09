import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '../hooks/useIsMobile';
import { useIsPortrait } from '../hooks/useIsPortrait';
import { useData } from '../hooks/useData';
import { eligiblePredictions } from '../hooks/useData';
import { useFilters } from '../hooks/useFilters';
import { applyFilters, getCreatorStats, calcBaselineAccuracy, ALL_CREATORS, CREATOR_DISPLAY, CREATOR_YOUTUBE_URL, formatPct, getAccuracyColor } from '../utils/accuracy';
import { ReportModal } from '../components/ReportModal';
import { InfoTooltip } from '../components/InfoTooltip';
import { useFilterDrawer } from '../components/Layout';
import type { Prediction, Event, Fight } from '../types';

const SITE_URL = 'https://octascore.xyz';
const OG_IMAGE = `${SITE_URL}/favicon.png`;

const CREATOR_BIO: Record<string, string> = {
  mma_joey: 'MMA Joey is one of those creators that feels plugged directly into the MMA fanbase — straight-up UFC talk, community debates, fight week reactions, and zero overproduced analyst energy. His prediction style is built around momentum, durability, pressure, and whether a fighter has that "dog" in them once things get ugly. Joey\'s the type to back a gritty underdog everybody counted out or fade a hype train before the rest of the community catches on.',
  mma_guru: 'MMA Guru has become one of the biggest voices in MMA YouTube through nonstop coverage, controversial takes, livestreams, and an ability to turn every UFC card into a storyline. His fight predictions go beyond pure technique — he talks confidence, activity, cardio, mentality, durability, and who he thinks folds when the pressure hits. Whether people agree with him or hate-watch him, Guru\'s picks have become part of the weekly MMA conversation.',
  the_weasel: 'The Weasle is the go-to creator for fans who care about the technical side of fighting without all the extra noise. His content is built around detailed film study, stylistic breakdowns, and explaining the small things that decide fights at the highest level. When it comes to predictions, The Weasle focuses heavily on striking habits, defensive tendencies, grappling transitions, and how styles actually interact inside the cage, which is why a lot of hardcore fans trust his reads going into big matchups.',
  lucas_tracy_mma: 'Lucas Tracy MMA is the channel for fans who actually want to understand why a fight plays out the way it does — no recycled takes, no panic picks, just genuine fight analysis that respects the sport. His predictions dig into the physical matchup first: reach, pace, wrestling, cage control, and how each fighter tends to respond when the plan gets punched in the face. Tracy has a habit of identifying the guy who\'s quietly been improving under the radar before the rest of the community figures it out, which makes his picks worth paying attention to when the whole world seems locked in on the favorite.',
};

const CARD_ORDER: Record<string, number> = {
  main_event: 0,
  co_main: 1,
  main_card: 2,
  prelim: 3,
  early_prelim: 4,
};

function AvatarBox({ creator, size }: { creator: string; size: number }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '14px',
      overflow: 'hidden',
      flexShrink: 0,
      border: '1px solid var(--border)',
      background: 'var(--panel)',
    }}>
      <img
        src={`/avatars/${creator}.jpg`}
        alt=""
        onError={() => setHidden(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}

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
  const [reportTarget, setReportTarget] = useState<{ prediction: Prediction; event: Event; fight: Fight | undefined } | null>(null);
  const isMobile = useIsMobile();
  const isPortrait = useIsPortrait();
  const { openDrawer } = useFilterDrawer();
  const mobilePortrait = isMobile && isPortrait;

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
  const baseline = useMemo(() => calcBaselineAccuracy(events, filters), [events, filters]);

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
      {/* Header: avatar on top (mobile) or left (desktop), then 3 blocks always side-by-side */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        {/* Creator selector — top-right, top edge aligned with avatar */}
        <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 100 }}>
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
        <div style={{ display: 'flex', flexDirection: mobilePortrait ? 'column' : 'row', alignItems: mobilePortrait ? 'flex-start' : 'flex-end', gap: mobilePortrait ? '0.75rem' : '1.5rem' }}>
        <AvatarBox creator={creator} size={mobilePortrait ? 112 : 80} />

        {/* Inner row: 3 blocks always side-by-side on both mobile and desktop */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: mobilePortrait ? '0.75rem' : '1.5rem' }}>

          {/* Block 1: name (top) + accuracy % (bottom) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
              {CREATOR_YOUTUBE_URL[creator] ? (
                <a
                  href={CREATOR_YOUTUBE_URL[creator]}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--logo-red)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--logo-red)')}
                >
                  {CREATOR_DISPLAY[creator]}
                </a>
              ) : CREATOR_DISPLAY[creator]}
            </h1>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: getAccuracyColor(stats.accuracy), lineHeight: 1 }}>
              {formatPct(stats.accuracy)}
            </span>
          </div>

          {/* Block 2: Baseline label+icon (top) + baseline accuracy (bottom) */}
          {baseline.total > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '2.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1 }}>
                Baseline<InfoTooltip />
              </div>
              <span style={{ color: getAccuracyColor(baseline.accuracy), fontWeight: 700, fontSize: '0.9rem', lineHeight: 1 }}>
                {formatPct(baseline.accuracy)}
              </span>
            </div>
          )}

          {/* Block 3: W-L (top) + eligible picks (bottom) */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '2.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1 }}>
              <span style={{ color: 'var(--accent-green)' }}>{stats.correct}</span>
              <span style={{ color: 'var(--text-secondary)' }}> - </span>
              <span style={{ color: 'var(--accent-red)' }}>{stats.incorrect}</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1 }}>
              {stats.eligible} eligible picks
            </div>
          </div>

        </div>
      </div>
      </div>

      {CREATOR_BIO[creator] && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
        }}>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.88rem',
            lineHeight: 1.7,
            margin: 0,
          }}>
            {CREATOR_BIO[creator]}
          </p>
        </div>
      )}

      {/* Fight Picks heading + filter button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--logo-red)' }}>
          Fight Picks
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
            <svg width="16" height="14" viewBox="0 0 14 12" fill="none" style={{ flexShrink: 0 }}>
              <path d="M0 1h14M2.5 6h9M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Filters
          </button>
        )}
      </div>

      {eventGroups.length === 0 && (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No predictions for selected filters.</div>
      )}

      {/* Event groups */}
      {reportTarget && (
        <ReportModal
          prediction={reportTarget.prediction}
          event={reportTarget.event}
          fight={reportTarget.fight}
          onClose={() => setReportTarget(null)}
        />
      )}

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
                    <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>
                      {eventDateShort}
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
                      { label: '', report: true },
                    ].map(({ label, hide, report }, idx) => (
                      <th key={idx} className={hide ? 'mobile-hide' : report ? 'report-flag-col' : ''} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', width: report ? '32px' : undefined }}>{label}</th>
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
                        <td className="report-flag-col" style={{ padding: '0 0.25rem', width: '32px', textAlign: 'center' }}>
                          <button
                            className="report-flag-btn"
                            title="Report a data issue"
                            onClick={() => setReportTarget({ prediction: p, event, fight })}
                          >
                            ⚑
                          </button>
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
