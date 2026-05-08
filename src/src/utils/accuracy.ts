import type { Event, Prediction, Filters } from '../types';
import { eligiblePredictions, calcAccuracy } from '../hooks/useData';

export function getAccuracyColor(acc: number): string {
  if (acc >= 0.65) return 'var(--accent-green)';
  if (acc >= 0.55) return 'var(--accent-yellow)';
  return 'var(--accent-red)';
}

export function formatPct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

export function getEventById(events: Event[], id: string): Event | undefined {
  return events.find(e => e.event_id === id);
}

export function applyFilters(predictions: Prediction[], events: Event[], filters: Filters): Prediction[] {
  return predictions.filter(p => {
    const event = events.find(e => e.event_id === p.event_id);
    if (!event) return false;
    if (filters.year !== 'all') {
      const year = new Date(event.date).getFullYear();
      if (year !== filters.year) return false;
    }
    if (filters.eventType !== 'all') {
      if ((event.event_type || 'fight_night') !== filters.eventType) return false;
    }
    if (filters.cardPosition !== 'all') {
      const fight = event.fights.find(f => f.fight_id === p.fight_id);
      if (!fight) return false;
      if (filters.cardPosition === 'main_event' && fight.card_position !== 'main_event') return false;
      if (filters.cardPosition === 'main_card' && !['main_event', 'main_card'].includes(fight.card_position)) return false;
    }
    return true;
  });
}

export const CREATOR_DISPLAY: Record<string, string> = {
  mma_guru: 'MMA Guru',
  mma_joey: 'MMA Joey',
  sneaky_mma: 'Sneaky MMA',
  brendan_schaub: 'Brendan Schaub',
  luke_thomas: 'Luke Thomas',
  the_weasel: 'The Weasel',
  bedtime_mma: 'Bedtime MMA',
  lucas_tracy_mma: 'Lucas Tracy MMA',
};

export const ALL_CREATORS = Object.keys(CREATOR_DISPLAY);

export function getCreatorStats(slug: string, allPredictions: Prediction[], events: Event[], filters: Filters) {
  const preds = applyFilters(allPredictions.filter(p => p.creator === slug), events, filters);
  const elig = eligiblePredictions(preds);
  const correct = elig.filter(p => p.correct).length;
  const incorrect = elig.filter(p => p.correct === false).length;
  const accuracy = calcAccuracy(preds);

  const mainEventPreds = elig.filter(p => {
    const ev = events.find(e => e.event_id === p.event_id);
    if (!ev) return false;
    const fight = ev.fights.find(f => f.fight_id === p.fight_id);
    return fight?.card_position === 'main_event';
  });
  const ppvPreds = elig.filter(p => {
    const ev = events.find(e => e.event_id === p.event_id);
    return ev?.event_type === 'ppv';
  });

  return {
    slug,
    displayName: CREATOR_DISPLAY[slug] || slug,
    accuracy,
    correct,
    incorrect,
    eligible: elig.length,
    mainEventAccuracy: mainEventPreds.length >= 5 ? mainEventPreds.filter(p => p.correct).length / mainEventPreds.length : null,
    ppvAccuracy: ppvPreds.length >= 5 ? ppvPreds.filter(p => p.correct).length / ppvPreds.length : null,
  };
}
