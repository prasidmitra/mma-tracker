export interface Fight {
  fight_id: string;
  fighter_a: string;
  fighter_b: string;
  winner: string | null;
  method: string;
  round: number;
  time: string;
  card_position: 'main_event' | 'main_card' | 'prelims' | 'early_prelims';
  card_type: 'main_card' | 'prelims' | 'early_prelims';
  weight_class: string;
  title_fight: boolean;
  odds_favorite?: string | null;
  odds_ml?: number | null;
}

export interface Event {
  event_id: string;
  name: string;
  date: string;
  event_type?: 'ppv' | 'fight_night';
  fights: Fight[];
}

export interface Prediction {
  prediction_id: string;
  creator: string;
  event_id: string;
  fight_id: string;
  video_id: string;
  predicted_winner: string | null;
  confidence: 'high' | 'medium' | 'low' | 'pick_em' | 'not_found';
  correct: boolean | null;
  prediction_changed: boolean;
  fight_skipped: boolean;
  ambiguous?: boolean;
  manually_resolved?: boolean;
}

export interface FlaggedPrediction {
  flag_id: string;
  creator: string;
  event_id: string;
  fight_id: string;
  video_id: string;
  ambiguity_reason: string;
  raw_excerpt: string;
  suggested_winner: string | null;
  confidence_in_suggestion: string;
  status: string;
  manually_resolved: boolean;
  resolved_winner: string | null;
}

export interface CreatorStats {
  slug: string;
  displayName: string;
  accuracy: number;
  correct: number;
  incorrect: number;
  eligible: number;
  mainEventAccuracy: number | null;
  ppvAccuracy: number | null;
}

export type Filters = {
  year: number | 'all';
  eventType: 'all' | 'ppv' | 'fight_night';
  cardPosition: 'all' | 'main_card' | 'main_event';
};
