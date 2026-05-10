import { useMemo } from 'react';
import { useFilters } from '../hooks/useFilters';
import { useData } from '../hooks/useData';
import type { Event, Filters } from '../types';

interface Props { events: Event[]; asDrawer?: boolean; collapsed?: boolean; onToggle?: () => void; }

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.65rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--text-secondary)',
      marginBottom: '0.375rem',
      marginTop: '1rem',
    }}>
      {children}
    </div>
  );
}

function FilterOption({ active, dim, onClick, children }: { active: boolean; dim?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '5px 8px',
      borderRadius: '5px',
      border: 'none',
      background: active ? 'var(--accent-purple)' : 'transparent',
      color: active ? '#fff' : dim ? 'var(--muted)' : 'var(--text-primary)',
      fontSize: '0.82rem',
      fontWeight: active ? 600 : 400,
      opacity: dim && !active ? 0.45 : 1,
      cursor: dim ? 'default' : 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.12s ease',
      marginBottom: '2px',
    }}
      onMouseEnter={e => { if (!active && !dim) e.currentTarget.style.background = 'var(--hover-overlay)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

export function Sidebar({ events, asDrawer = false, collapsed = false, onToggle }: Props) {
  const [filters, setFilters] = useFilters();
  const { predictions } = useData();

  const years = useMemo(() => {
    const ys = new Set(events.map(e => new Date(e.date).getFullYear()));
    return Array.from(ys).sort((a, b) => b - a);
  }, [events]);

  const yearsWithData = useMemo(() => {
    const eventYearMap = new Map(events.map(e => [e.event_id, new Date(e.date).getFullYear()]));
    const ys = new Set<number>();
    predictions.forEach(p => {
      const y = eventYearMap.get(p.event_id);
      if (y) ys.add(y);
    });
    return ys;
  }, [events, predictions]);

  if (!asDrawer && collapsed) {
    return (
      <aside style={{
        width: '36px',
        minWidth: '36px',
        borderRight: '1px solid var(--border)',
        position: 'sticky',
        top: '54px',
        height: 'calc(100vh - 54px)',
        background: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '0.75rem',
        transition: 'width 0.2s ease',
      }}>
        <button
          onClick={onToggle}
          title="Expand filters"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            lineHeight: 1,
            fontSize: '1rem',
          }}
        >›</button>
      </aside>
    );
  }

  return (
    <aside style={asDrawer ? {
      padding: '0.75rem 1rem 0.5rem',
      background: 'none',
    } : {
      width: '200px',
      minWidth: '200px',
      padding: '1rem 0.875rem',
      borderRight: '1px solid var(--border)',
      position: 'sticky',
      top: '54px',
      height: 'calc(100vh - 54px)',
      overflowY: 'auto',
      background: 'var(--bg-card)',
      transition: 'width 0.2s ease',
    }}>
      {!asDrawer && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
          <button
            onClick={onToggle}
            title="Collapse filters"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              lineHeight: 1,
              fontSize: '1rem',
            }}
          >‹</button>
        </div>
      )}
      {asDrawer ? (
        /* ── Drawer: 3-column layout ── */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 0.5rem' }}>
          {/* Year */}
          <div>
            <FilterLabel>Year</FilterLabel>
            <FilterOption active={filters.year === 'all'} onClick={() => setFilters({ year: 'all' })}>All Time</FilterOption>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
              {years.map(y => (
                <FilterOption key={y} active={filters.year === y} dim={!yearsWithData.has(y)} onClick={() => setFilters({ year: y })}>{y}</FilterOption>
              ))}
            </div>
          </div>
          {/* Event Type */}
          <div>
            <FilterLabel>Event Type</FilterLabel>
            {([['all', 'All'], ['ppv', 'PPV'], ['fight_night', 'Fight Nights']] as [Filters['eventType'], string][]).map(([val, label]) => (
              <FilterOption key={val} active={filters.eventType === val} onClick={() => setFilters({ eventType: val })}>{label}</FilterOption>
            ))}
          </div>
          {/* Card Position */}
          <div>
            <FilterLabel>Card</FilterLabel>
            {([['all', 'All Fights'], ['main_card', 'Main Card'], ['main_event', 'Main Event']] as [Filters['cardPosition'], string][]).map(([val, label]) => (
              <FilterOption key={val} active={filters.cardPosition === val} onClick={() => setFilters({ cardPosition: val })}>{label}</FilterOption>
            ))}
          </div>
        </div>
      ) : (
        /* ── Sidebar: existing stacked layout ── */
        <>
          <FilterLabel>Year</FilterLabel>
          <FilterOption active={filters.year === 'all'} onClick={() => setFilters({ year: 'all' })}>All Time</FilterOption>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {years.map(y => (
              <FilterOption key={y} active={filters.year === y} dim={!yearsWithData.has(y)} onClick={() => setFilters({ year: y })}>{y}</FilterOption>
            ))}
          </div>
          <FilterLabel>Event Type</FilterLabel>
          {([['all', 'All Events'], ['ppv', 'PPV Only'], ['fight_night', 'Fight Nights']] as [Filters['eventType'], string][]).map(([val, label]) => (
            <FilterOption key={val} active={filters.eventType === val} onClick={() => setFilters({ eventType: val })}>{label}</FilterOption>
          ))}
          <FilterLabel>Card Position</FilterLabel>
          {([['all', 'All Fights'], ['main_card', 'Main Card'], ['main_event', 'Main Event Only']] as [Filters['cardPosition'], string][]).map(([val, label]) => (
            <FilterOption key={val} active={filters.cardPosition === val} onClick={() => setFilters({ cardPosition: val })}>{label}</FilterOption>
          ))}
        </>
      )}
    </aside>
  );
}
