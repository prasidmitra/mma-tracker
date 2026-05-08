import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Event, Prediction, FlaggedPrediction } from '../types';
import { mockEvents, mockPredictions, mockFlagged } from '../data/mock';

const USE_MOCK = true;

const CREATORS = ['mma_guru', 'mma_joey', 'sneaky_mma', 'brendan_schaub', 'luke_thomas', 'the_weasel', 'bedtime_mma', 'lucas_tracy_mma'];

interface DataContextValue {
  events: Event[];
  predictions: Prediction[];
  flagged: FlaggedPrediction[];
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextValue>({ events: [], predictions: [], flagged: [], loading: true, error: null });

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return res.json();
  } catch {
    return fallback;
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataContextValue>({ events: [], predictions: [], flagged: [], loading: true, error: null });

  useEffect(() => {
    if (USE_MOCK) {
      setState({ events: mockEvents, predictions: mockPredictions, flagged: mockFlagged, loading: false, error: null });
      return;
    }
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetchJson<Event[]>(`${base}data/events.json`, []),
      fetchJson<FlaggedPrediction[]>(`${base}data/flagged.json`, []),
      ...CREATORS.map(c => fetchJson<Prediction[]>(`${base}data/predictions/${c}.json`, [])),
    ]).then(([events, flagged, ...creatorPreds]) => {
      setState({ events: events as Event[], predictions: (creatorPreds as Prediction[][]).flat(), flagged: flagged as FlaggedPrediction[], loading: false, error: null });
    }).catch(err => {
      setState(s => ({ ...s, loading: false, error: err.message }));
    });
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useData() { return useContext(DataContext); }
