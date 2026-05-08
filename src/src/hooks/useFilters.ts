import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Filters } from '../types';

export function useFilters(): [Filters, (f: Partial<Filters>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: Filters = {
    year: searchParams.get('year') === 'all' || !searchParams.get('year') ? 'all' : Number(searchParams.get('year')),
    eventType: (searchParams.get('eventType') as Filters['eventType']) || 'all',
    cardPosition: (searchParams.get('cardPosition') as Filters['cardPosition']) || 'all',
  };

  const setFilters = useCallback((updates: Partial<Filters>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === 'all' || v === undefined) next.delete(k);
        else next.set(k, String(v));
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return [filters, setFilters];
}
