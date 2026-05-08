import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Event, Prediction, FlaggedPrediction } from '../types';
import { mockEvents, mockPredictions, mockFlagged } from '../data/mock';

const USE_MOCK = false;

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
    if (!res.ok) {
      console.warn(`[DataContext] ${url} returned ${res.status}`);
      return fallback;
    }
    return await res.json() as T;
  } catch (e) {
    console.error(`[DataContext] fetch error for ${url}:`, e);
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

    const eventsPromise = fetchJson<Event[]>(`${base}data/events.json`, []);
    const flaggedPromise = fetchJson<FlaggedPrediction[]>(`${base}data/flagged.json`, []);
    const creatorPromises = CREATORS.map(c => fetchJson<Prediction[]>(`${base}data/predictions/${c}.json`, []));

    Promise.all([eventsPromise, flaggedPromise, ...creatorPromises])
      .then(results => {
        const events = results[0] as Event[];
        const flagged = results[1] as FlaggedPrediction[];
        const predictions = (results.slice(2) as Prediction[][]).flat();
        console.log(`[DataContext] loaded: ${events.length} events, ${predictions.length} predictions`);
        setState({ events, predictions, flagged, loading: false, error: null });
      })
      .catch(err => {
        console.error('[DataContext] Promise.all error:', err);
        setState(s => ({ ...s, loading: false, error: err.message }));
      });
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useData() { return useContext(DataContext); }
