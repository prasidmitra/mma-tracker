import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { applyFilters, CREATOR_DISPLAY } from '../utils/accuracy';
import { eligiblePredictions } from '../hooks/useData';
import type { Event, Prediction, Filters } from '../types';

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

function abbreviate(name: string): string {
  return name
    .replace('UFC Fight Night', 'UFN')
    .replace('UFC on ESPN', 'ESPN')
    .replace('UFC on ABC', 'ABC')
    .replace('UFC on Fox', 'Fox');
}

function getQuarterTicks(minTs: number, maxTs: number): number[] {
  const ticks: number[] = [];
  const d = new Date(minTs);
  // rewind to start of the current quarter
  let year = d.getFullYear();
  let qMonth = Math.floor(d.getMonth() / 3) * 3;
  let cur = new Date(year, qMonth, 1).getTime();
  // step forward quarter by quarter
  while (cur <= maxTs) {
    if (cur >= minTs) ticks.push(cur);
    qMonth += 3;
    if (qMonth >= 12) { qMonth = 0; year++; }
    cur = new Date(year, qMonth, 1).getTime();
  }
  return ticks;
}

const QUARTER_END_MONTHS = ['Mar', 'Jun', 'Sep', 'Dec'];

function formatQuarter(ts: number): string {
  const d = new Date(ts);
  const q = Math.floor(d.getMonth() / 3);
  return `${QUARTER_END_MONTHS[q]} ${d.getFullYear()}`;
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  color: string;
  payload: Record<string, string | number | undefined>;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
}

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const eventName = payload[0]?.payload?.eventName as string | undefined;
  const date = payload[0]?.payload?.date as string | undefined;
  const entries = [...payload]
    .filter(p => p.value != null)
    .sort((a, b) => b.value - a.value);
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '0.6rem 0.875rem',
      fontSize: '0.8rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      minWidth: '170px',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.1rem', fontSize: '0.82rem' }}>
        {eventName}
      </div>
      {date && (
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '0.45rem' }}>
          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}
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
  filters: Filters;
  activeCreators: string[];
}

export function AccuracyChart({ events, predictions, filters, activeCreators }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const chartData = useMemo(() => {
    const filtered = events
      .filter(e => {
        if (filters.year !== 'all' && new Date(e.date).getFullYear() !== filters.year) return false;
        if (filters.eventType !== 'all' && (e.event_type ?? 'fight_night') !== filters.eventType) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filtered
      .map(event => {
        const point: Record<string, string | number | undefined> = {
          eventName: abbreviate(event.name),
          date: event.date,
          timestamp: new Date(event.date).getTime(),
        };
        for (const slug of activeCreators) {
          const preds = applyFilters(
            predictions.filter(p => p.creator === slug && p.event_id === event.event_id),
            events,
            filters,
          );
          const elig = eligiblePredictions(preds);
          if (elig.length > 0) {
            const correct = elig.filter(p => p.correct).length;
            point[slug] = Math.round((correct / elig.length) * 1000) / 10;
          }
        }
        return point;
      })
      .filter(p => activeCreators.some(slug => p[slug] !== undefined));
  }, [events, predictions, filters, activeCreators]);

  const quarterTicks = useMemo(() => {
    if (chartData.length < 2) return [];
    const timestamps = chartData.map(d => d.timestamp as number);
    return getQuarterTicks(Math.min(...timestamps), Math.max(...timestamps));
  }, [chartData]);

  if (chartData.length < 2) return null;

  const toggleCreator = (slug: string) => {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--logo-red)', textShadow: '0 0 40px rgba(245, 197, 66, 0.18)', marginBottom: '0.75rem' }}>
        Accuracy Trend
      </h2>
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '1rem 1rem 0.75rem',
    }}>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem 0.6rem', marginBottom: '0.75rem', paddingLeft: '0.25rem' }}>
        {activeCreators.map(slug => {
          const color = CREATOR_COLORS[slug] ?? '#888';
          const isHidden = hidden.has(slug);
          return (
            <button
              key={slug}
              onClick={() => toggleCreator(slug)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 6px', borderRadius: '4px',
                opacity: isHidden ? 0.3 : 1,
                transition: 'opacity 0.15s',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ width: 24, height: 2.5, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {CREATOR_DISPLAY[slug] ?? slug}
              </span>
            </button>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            ticks={quarterTicks}
            tickFormatter={formatQuarter}
            tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
            height={36}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif' }}
            width={44}
            tickCount={6}
          />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine
            y={50}
            stroke="var(--border)"
            strokeDasharray="4 4"
            label={{ value: '50%', fontSize: 10, fill: 'var(--text-secondary)', position: 'insideTopLeft' }}
          />
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
