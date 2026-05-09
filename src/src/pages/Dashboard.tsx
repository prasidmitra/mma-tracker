import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../hooks/useData';
import { useFilters } from '../hooks/useFilters';
import { useIsMobile } from '../hooks/useIsMobile';
import { useFilterDrawer } from '../components/Layout';
import { getCreatorStats, ALL_CREATORS, formatPct, getAccuracyColor } from '../utils/accuracy';

const SITE_URL = 'https://octascore.xyz';
const OG_IMAGE = `${SITE_URL}/favicon.png`;

export function Dashboard() {
  const { events, predictions, loading } = useData();
  const [filters] = useFilters();
  const isMobile = useIsMobile();
  const { openDrawer } = useFilterDrawer();

  const stats = useMemo(() => {
    return ALL_CREATORS
      .map(slug => getCreatorStats(slug, predictions, events, filters))
      .filter(s => s.eligible > 0)
      .sort((a, b) => b.accuracy - a.accuracy);
  }, [predictions, events, filters]);

  return (
    <div className="page-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      <Helmet>
        <title>OctaScore — MMA Prediction Accuracy Tracker | Who Really Knows MMA?</title>
        <meta name="description" content="Track which MMA YouTubers actually get their picks right. Compare prediction accuracy across events, years, and card positions." />
        <meta property="og:title" content="OctaScore — MMA Prediction Accuracy Tracker" />
        <meta property="og:description" content="See who's actually sharp vs who just sounds confident. Live accuracy leaderboard for top MMA YouTube predictors." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="OctaScore — MMA Prediction Accuracy Tracker" />
        <meta name="twitter:description" content="See who's actually sharp vs who just sounds confident. Live accuracy leaderboard for top MMA YouTube predictors." />
        <link rel="canonical" href={`${SITE_URL}/`} />
      </Helmet>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Loading data...
        </div>
      ) : (
      <>
      {/* Hero */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
          See how the top MMA YouTubers perform on their picks.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '0.5rem' }}>
          Track prediction accuracy across UFC events, compare creator records, and see who's really calling fights right over time. From upset picks to hype-train fades, OCTASCORE lets the MMA community compare predictions with real results.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          Curious why this site exists?{' '}
          <Link to="/about" style={{ color: 'var(--highlight)', fontWeight: 600 }}>Read the About page</Link>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="leaderboard-heading" style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--logo-red)', textShadow: '0 0 40px rgba(245, 197, 66, 0.18)' }}>
            Leaderboard
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

      {stats.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', padding: '2rem 0', textAlign: 'center' }}>
          No data for the selected filters.
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Rank', center: true },
                  { label: 'Creator' },
                  { label: 'Accuracy' },
                  { label: 'Record' },
                  { label: 'Picks Made', hide: true },
                  { label: 'Main Event Acc', hide: true },
                  { label: 'PPV Acc', hide: true },
                ].map(({ label, center, hide }) => (
                  <th key={label} className={hide ? 'mobile-hide' : ''} style={{
                    padding: '0.625rem 0.875rem',
                    textAlign: center ? 'center' : 'left',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                  }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={s.slug} style={{
                  borderBottom: '1px solid var(--border)',
                  background: i === 0 ? 'rgba(245,197,66,0.04)' : 'transparent',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(107,63,152,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i === 0 ? 'rgba(245,197,66,0.04)' : 'transparent')}
                >
                  <td style={{ padding: '0.75rem 0.875rem', textAlign: 'center', color: i === 0 ? 'var(--gold-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>{i + 1}</td>
                  <td className="mobile-creator-cell" style={{ padding: '0.75rem 0.875rem' }}>
                    <Link to={`/creator/${s.slug}`} style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-purple)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}>
                      {s.displayName}
                    </Link>
                  </td>
                  <td style={{ padding: '0.75rem 0.875rem' }}>
                    <span style={{ color: getAccuracyColor(s.accuracy), fontWeight: 800, fontSize: '1.1rem' }}>
                      {formatPct(s.accuracy)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <span style={{ color: 'var(--accent-green)' }}>{s.correct}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>-</span>
                    <span style={{ color: 'var(--accent-red)' }}>{s.incorrect}</span>
                  </td>
                  <td className="mobile-hide" style={{ padding: '0.75rem 0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.eligible}</td>
                  <td className="mobile-hide" style={{ padding: '0.75rem 0.875rem' }}>
                    {s.mainEventAccuracy !== null
                      ? <span style={{ color: getAccuracyColor(s.mainEventAccuracy), fontWeight: 700 }}>{formatPct(s.mainEventAccuracy)}</span>
                      : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                  </td>
                  <td className="mobile-hide" style={{ padding: '0.75rem 0.875rem' }}>
                    {s.ppvAccuracy !== null
                      ? <span style={{ color: getAccuracyColor(s.ppvAccuracy), fontWeight: 700 }}>{formatPct(s.ppvAccuracy)}</span>
                      : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textAlign: 'center' }}>
        Accuracy excludes pick'ems, cancelled fights, and predictions pending review
      </p>

      </>
      )}
    </div>
  );
}
