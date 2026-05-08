import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { useFilters } from '../hooks/useFilters';
import { getCreatorStats, ALL_CREATORS, formatPct, getAccuracyColor } from '../utils/accuracy';

export function Dashboard() {
  const { events, predictions, flagged, loading } = useData();
  const [filters] = useFilters();

  const stats = useMemo(() => {
    return ALL_CREATORS
      .map(slug => getCreatorStats(slug, predictions, events, filters))
      .filter(s => s.eligible > 0)
      .sort((a, b) => b.accuracy - a.accuracy);
  }, [predictions, events, filters]);

  const pendingFlags = flagged.filter(f => !f.manually_resolved).length;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
      Loading data...
    </div>
  );


  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Hero */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          See how the top MMA YouTubers perform on their picks.
        </p>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--logo-red)', textShadow: '0 0 40px rgba(245, 197, 66, 0.18)' }}>
          Leaderboard
        </h2>
      </div>

      {pendingFlags > 0 && (
        <div style={{
          border: '1px solid var(--gold-primary)',
          background: 'rgba(245,197,66,0.07)',
          borderRadius: '6px',
          padding: '0.625rem 1rem',
          marginBottom: '1rem',
          color: 'var(--gold-primary)',
          fontSize: '0.8rem',
          fontWeight: 500,
          boxShadow: '0 0 16px rgba(245, 197, 66, 0.10)',
        }}>
          ⚠ {pendingFlags} prediction{pendingFlags !== 1 ? 's' : ''} pending manual review — excluded from accuracy calculations
        </div>
      )}

      {stats.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', padding: '2rem 0', textAlign: 'center' }}>
          No data for the selected filters.
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Rank', 'Creator', 'Accuracy', 'Record', 'Picks Made', 'Main Event Acc', 'PPV Acc'].map(h => (
                  <th key={h} style={{
                    padding: '0.625rem 0.875rem',
                    textAlign: h === 'Rank' ? 'center' : 'left',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={s.slug} style={{
                  borderBottom: '1px solid var(--border)',
                  background: i === 0 ? 'rgba(245,197,66,0.04)' : (i % 2 === 1 ? 'var(--bg-row-alt)' : 'transparent'),
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(107,63,152,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i === 0 ? 'rgba(245,197,66,0.04)' : (i % 2 === 1 ? 'var(--bg-row-alt)' : 'transparent'))}
                >
                  <td style={{ padding: '0.75rem 0.875rem', textAlign: 'center', color: i === 0 ? 'var(--gold-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>{i + 1}</td>
                  <td style={{ padding: '0.75rem 0.875rem' }}>
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
                  <td style={{ padding: '0.75rem 0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.eligible}</td>
                  <td style={{ padding: '0.75rem 0.875rem' }}>
                    {s.mainEventAccuracy !== null
                      ? <span style={{ color: getAccuracyColor(s.mainEventAccuracy), fontWeight: 700 }}>{formatPct(s.mainEventAccuracy)}</span>
                      : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.75rem 0.875rem' }}>
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
    </div>
  );
}
