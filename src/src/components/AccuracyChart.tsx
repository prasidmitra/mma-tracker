import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ALL_CREATORS, CREATOR_DISPLAY } from '../utils/accuracy';
import { eligiblePredictions } from '../hooks/useData';
import type { Event, Prediction } from '../types';

const CREATOR_COLORS: Record<string, string> = {
  mma_guru:        '#a78bfa',
  mma_joey:        'var(--accent-red)',
  sneaky_mma:      '#34d399',
  brendan_schaub:  '#fb923c',
  luke_thomas:     '#f472b6',
  the_weasel:      '#facc15',
  bedtime_mma:     '#f87171',
  lucas_tracy_mma: '#34d399',
};


interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  color: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const entries = [...payload]
    .filter(e => e.value != null)
    .sort((a, b) => b.value - a.value);
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '0.6rem 0.875rem',
      fontSize: '0.8rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      minWidth: '160px',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>{label}</div>
      {entries.map(e => (
        <div key={e.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '2px', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block', flexShrink: 0 }} />
            {CREATOR_DISPLAY[e.dataKey] ?? e.dataKey}
          </span>
          <span style={{ fontWeight: 700, color: e.color }}>{e.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  events: Event[];
  predictions: Prediction[];
}

export function AccuracyChart({ events, predictions }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const { chartData, activeCreators } = useMemo(() => {
    const eventYearMap = new Map(events.map(e => [e.event_id, new Date(e.date).getFullYear()]));

    const years = new Set<number>();
    predictions.forEach(p => {
      const y = eventYearMap.get(p.event_id);
      if (y) years.add(y);
    });
    const sortedYears = Array.from(years).sort((a, b) => a - b);

    const creatorsWithData = new Set<string>();

    const data = sortedYears.map(year => {
      const point: Record<string, number | string> = { year };

      for (const slug of ALL_CREATORS) {
        const preds = predictions.filter(p => p.creator === slug && eventYearMap.get(p.event_id) === year);
        const elig = eligiblePredictions(preds);
        if (elig.length > 0) {
          const correct = elig.filter(p => p.correct).length;
          point[slug] = Math.round((correct / elig.length) * 1000) / 10;
          creatorsWithData.add(slug);
        }
      }

      return point;
    });

    return { chartData: data, activeCreators: ALL_CREATORS.filter(s => creatorsWithData.has(s)) };
  }, [events, predictions]);

  if (chartData.length < 2) return null;

  const allValues = chartData.flatMap(d =>
    activeCreators.map(k => d[k] as number).filter(v => v != null)
  );
  const minVal = Math.max(0, Math.floor(Math.min(...allValues)) - 2);
  const maxVal = Math.min(100, Math.ceil(Math.max(...allValues)) + 2);

  const toggle = (key: string) => setHidden(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const legendItems = activeCreators.map(s => ({ key: s, label: CREATOR_DISPLAY[s] ?? s, color: CREATOR_COLORS[s] ?? '#888' }));

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--logo-red)', textShadow: '0 0 40px rgba(245, 197, 66, 0.18)', marginBottom: '0.75rem' }}>
        Accuracy Trend By Year
      </h2>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1rem 1rem 0.75rem',
      }}>
        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem 0.6rem', marginBottom: '0.75rem', paddingLeft: '0.25rem' }}>
          {legendItems.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 6px', borderRadius: '4px',
                opacity: hidden.has(key) ? 0.3 : 1,
                transition: 'opacity 0.15s',
                fontFamily: 'inherit',
              }}
            >
              <svg width="24" height="4" style={{ flexShrink: 0 }}>
                <line x1="0" y1="2" x2="24" y2="2" stroke={color} strokeWidth="2.5" />
              </svg>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
              tickLine={false}
            />
            <YAxis
              domain={[minVal, maxVal]}
              tickFormatter={v => `${v}%`}
              tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
              width={44}
              tickCount={6}
            />
            <Tooltip content={<ChartTooltip />} />
            {activeCreators.map(slug => (
              <Line
                key={slug}
                type="monotone"
                dataKey={slug}
                stroke={CREATOR_COLORS[slug] ?? '#888'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
                hide={hidden.has(slug)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
