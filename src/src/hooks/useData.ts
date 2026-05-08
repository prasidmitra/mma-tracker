export { useData } from '../context/DataContext';

import type { Prediction } from '../types';

export function eligiblePredictions(predictions: Prediction[]): Prediction[] {
  return predictions.filter(p =>
    p.correct !== null &&
    p.predicted_winner !== null &&
    p.fight_skipped !== true &&
    (p.ambiguous !== true || p.manually_resolved === true)
  );
}

export function calcAccuracy(predictions: Prediction[]): number {
  const eligible = eligiblePredictions(predictions);
  if (eligible.length === 0) return 0;
  return eligible.filter(p => p.correct === true).length / eligible.length;
}
