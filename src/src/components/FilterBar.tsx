import { useMemo } from 'react';
import { useFilters } from '../hooks/useFilters';
import type { Event, Filters } from '../types';

interface Props { events: Event[]; }

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 12px',
      borderRadius: '20px',
      border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border)'}`,
      background: active ? 'var(--accent-blue)' : 'transparent',
      color: active ? '#0d1117' : 'var(--text-secondary)',
      fontSize: '0.75rem',
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.15s ease-in-out',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  );
}

export function FilterBar({ events }: Props) {
  const [filters, setFilters] = useFilters();

  const years = useMemo(() => {
    const ys = new Set(events.map(e => new Date(e.date).getFullYear()));
    return Array.from(ys).sort((a, b) => b - a);
  }, [events]);

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '0.625rem 1.5rem',
      position: 'sticky',
      top: '52px',
      zIndex: 99,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.25rem', minWidth: '30px' }}>Year</span>
        <Pill active={filters.year === 'all'} onClick={() => setFilters({ year: 'all' })}>All Time</Pill>
        {years.map(y => (
          <Pill key={y} active={filters.year === y} onClick={() => setFilters({ year: y })}>
            {y}
          </Pill>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.25rem', minWidth: '30px' }}>Type</span>
        {([['all', 'All Events'], ['ppv', 'PPV Only'], ['fight_night', 'Fight Nights Only']] as [Filters['eventType'], string][]).map(([val, label]) => (
          <Pill key={val} active={filters.eventType === val} onClick={() => setFilters({ eventType: val })}>{label}</Pill>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.25rem', minWidth: '30px' }}>Card</span>
        {([['all', 'All Fights'], ['main_card', 'Main Card'], ['main_event', 'Main Event Only']] as [Filters['cardPosition'], string][]).map(([val, label]) => (
          <Pill key={val} active={filters.cardPosition === val} onClick={() => setFilters({ cardPosition: val })}>{label}</Pill>
        ))}
      </div>
    </div>
  );
}
