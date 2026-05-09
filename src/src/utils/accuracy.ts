import type { Event, Prediction, Filters } from '../types';
import { eligiblePredictions, calcAccuracy } from '../hooks/useData';

export function getAccuracyColor(acc: number): string {
  if (acc >= 0.65) return 'var(--success)';
  if (acc >= 0.55) return 'var(--gold-primary)';
  return 'var(--danger)';
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
      if (filters.cardPosition === 'main_card' && !['main_event', 'co_main', 'main_card'].includes(fight.card_position)) return false;
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
  the_weasel: 'The Weasle',
  bedtime_mma: 'Bedtime MMA',
  lucas_tracy_mma: 'Lucas Tracy MMA',
};

export const ALL_CREATORS = Object.keys(CREATOR_DISPLAY);

export const CREATOR_YOUTUBE_URL: Record<string, string> = {
  mma_guru:       'https://www.youtube.com/@the-mma-guru',
  mma_joey:       'https://www.youtube.com/@MMAJOEYC',
  sneaky_mma:     'https://youtube.com/@SneakyMMA',
  brendan_schaub: 'https://youtube.com/@BrendanSchaubPodcast',
  luke_thomas:    'https://youtube.com/@LukeThomas',
  the_weasel:     'https://www.youtube.com/channel/UCZD2qRU8J82XGdGdUWYneNQ',
  bedtime_mma:    'https://www.youtube.com/results?search_query=Bedtime+MMA+predictions',
  lucas_tracy_mma:'https://www.youtube.com/channel/UC7LzaJA-R2E52qzd5GW-kpg',
};

export function calcBaselineAccuracy(events: Event[], filters: Filters): { correct: number; total: number; accuracy: number } {
  let correct = 0;
  let total = 0;
  for (const event of events) {
    if (filters.year !== 'all' && new Date(event.date).getFullYear() !== filters.year) continue;
    if (filters.eventType !== 'all' && (event.event_type || 'fight_night') !== filters.eventType) continue;
    for (const fight of event.fights) {
      if (!fight.odds_favorite || !fight.winner) continue;
      if (filters.cardPosition === 'main_event' && fight.card_position !== 'main_event') continue;
      if (filters.cardPosition === 'main_card' && !['main_event', 'co_main', 'main_card'].includes(fight.card_position)) continue;
      total++;
      if (fight.odds_favorite === fight.winner) correct++;
    }
  }
  return { correct, total, accuracy: total > 0 ? correct / total : 0 };
}

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
