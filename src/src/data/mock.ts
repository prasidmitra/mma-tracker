import type { Event, Prediction, FlaggedPrediction } from '../types';

export const mockEvents: Event[] = [
  {
    event_id: 'ufc-300',
    name: 'UFC 300',
    date: '2024-04-13',
    event_type: 'ppv',
    fights: [
      { fight_id: 'ufc-300-pereira-hill', fighter_a: 'Alex Pereira', fighter_b: 'Jamahal Hill', winner: 'Alex Pereira', method: 'KO', round: 1, time: '1:54', card_position: 'main_event', card_type: 'main_card', weight_class: 'Light Heavyweight', title_fight: true },
      { fight_id: 'ufc-300-holloway-gaethje', fighter_a: 'Max Holloway', fighter_b: 'Justin Gaethje', winner: 'Max Holloway', method: 'KO', round: 5, time: '4:59', card_position: 'main_card', card_type: 'main_card', weight_class: 'Lightweight', title_fight: false },
      { fight_id: 'ufc-300-poirier-saint-denis', fighter_a: 'Dustin Poirier', fighter_b: 'Benoit Saint Denis', winner: 'Dustin Poirier', method: 'TKO', round: 3, time: '1:23', card_position: 'main_card', card_type: 'main_card', weight_class: 'Lightweight', title_fight: false },
      { fight_id: 'ufc-300-zhang-yan', fighter_a: 'Zhang Weili', fighter_b: 'Yan Xiaonan', winner: 'Zhang Weili', method: 'Decision', round: 5, time: '5:00', card_position: 'main_card', card_type: 'main_card', weight_class: 'Strawweight', title_fight: true },
      { fight_id: 'ufc-300-ankalaev-walker', fighter_a: 'Magomed Ankalaev', fighter_b: 'Johnny Walker', winner: 'Magomed Ankalaev', method: 'KO', round: 3, time: '2:11', card_position: 'main_card', card_type: 'main_card', weight_class: 'Light Heavyweight', title_fight: false },
      { fight_id: 'ufc-300-sterling-sandhagen', fighter_a: 'Aljamain Sterling', fighter_b: 'Calvin Kattar', winner: 'Aljamain Sterling', method: 'Decision', round: 3, time: '5:00', card_position: 'main_card', card_type: 'main_card', weight_class: 'Featherweight', title_fight: false },
      { fight_id: 'ufc-300-jiri-barboza', fighter_a: 'Jiri Prochazka', fighter_b: 'Edson Barboza', winner: 'Jiri Prochazka', method: 'KO', round: 1, time: '2:35', card_position: 'main_card', card_type: 'main_card', weight_class: 'Light Heavyweight', title_fight: false },
      { fight_id: 'ufc-300-pantoja-erceg', fighter_a: 'Alexandre Pantoja', fighter_b: 'Steve Erceg', winner: 'Alexandre Pantoja', method: 'Decision', round: 5, time: '5:00', card_position: 'main_card', card_type: 'main_card', weight_class: 'Flyweight', title_fight: true },
    ]
  },
  {
    event_id: 'ufc-299',
    name: 'UFC 299',
    date: '2024-03-09',
    event_type: 'ppv',
    fights: [
      { fight_id: 'ufc-299-omalley-vera', fighter_a: "Sean O'Malley", fighter_b: 'Marlon Vera', winner: "Sean O'Malley", method: 'Decision', round: 5, time: '5:00', card_position: 'main_event', card_type: 'main_card', weight_class: 'Bantamweight', title_fight: true },
      { fight_id: 'ufc-299-dustin-benson', fighter_a: 'Dustin Poirier', fighter_b: 'Benoit Saint Denis', winner: 'Dustin Poirier', method: 'Submission', round: 2, time: '3:30', card_position: 'main_card', card_type: 'main_card', weight_class: 'Lightweight', title_fight: false },
      { fight_id: 'ufc-299-romero-mcgregor', fighter_a: 'Kevin Holland', fighter_b: 'Carlos Prates', winner: 'Carlos Prates', method: 'KO', round: 1, time: '0:57', card_position: 'main_card', card_type: 'main_card', weight_class: 'Welterweight', title_fight: false },
      { fight_id: 'ufc-299-moicano-gamrot', fighter_a: 'Renato Moicano', fighter_b: 'Jalin Turner', winner: 'Renato Moicano', method: 'Decision', round: 3, time: '5:00', card_position: 'main_card', card_type: 'main_card', weight_class: 'Lightweight', title_fight: false },
      { fight_id: 'ufc-299-rakic-walker', fighter_a: 'Aleksandar Rakic', fighter_b: 'Carlos Ulberg', winner: 'Carlos Ulberg', method: 'KO', round: 1, time: '3:34', card_position: 'main_card', card_type: 'main_card', weight_class: 'Light Heavyweight', title_fight: false },
      { fight_id: 'ufc-299-strickland-du-plessis', fighter_a: 'Sean Strickland', fighter_b: 'Dricus Du Plessis', winner: 'Dricus Du Plessis', method: 'Decision', round: 5, time: '5:00', card_position: 'main_card', card_type: 'main_card', weight_class: 'Middleweight', title_fight: false },
    ]
  },
  {
    event_id: 'ufc-fight-night-240',
    name: 'UFC Fight Night 240',
    date: '2024-06-22',
    event_type: 'fight_night',
    fights: [
      { fight_id: 'ufcfn240-santos-ankalaev', fighter_a: 'Thiago Santos', fighter_b: 'Jamahal Hill', winner: 'Jamahal Hill', method: 'TKO', round: 3, time: '4:15', card_position: 'main_event', card_type: 'main_card', weight_class: 'Light Heavyweight', title_fight: false },
      { fight_id: 'ufcfn240-rountree-spann', fighter_a: 'Khalil Rountree', fighter_b: 'Ryan Spann', winner: 'Khalil Rountree', method: 'TKO', round: 1, time: '2:33', card_position: 'main_card', card_type: 'main_card', weight_class: 'Light Heavyweight', title_fight: false },
      { fight_id: 'ufcfn240-hooker-tsarukyan', fighter_a: 'Dan Hooker', fighter_b: 'Mateusz Gamrot', winner: 'Dan Hooker', method: 'KO', round: 2, time: '1:59', card_position: 'main_card', card_type: 'main_card', weight_class: 'Lightweight', title_fight: false },
      { fight_id: 'ufcfn240-vettori-costa', fighter_a: 'Marvin Vettori', fighter_b: 'Paulo Costa', winner: null, method: 'NC', round: 3, time: '2:11', card_position: 'main_card', card_type: 'main_card', weight_class: 'Middleweight', title_fight: false },
      { fight_id: 'ufcfn240-tab-simon', fighter_a: 'Tabatha Ricci', fighter_b: 'Gillian Robertson', winner: 'Tabatha Ricci', method: 'Decision', round: 3, time: '5:00', card_position: 'main_card', card_type: 'main_card', weight_class: 'Strawweight', title_fight: false },
    ]
  },
  {
    event_id: 'ufc-305',
    name: 'UFC 305',
    date: '2024-08-17',
    event_type: 'ppv',
    fights: [
      { fight_id: 'ufc-305-du-plessis-adesanya', fighter_a: 'Dricus Du Plessis', fighter_b: 'Israel Adesanya', winner: 'Dricus Du Plessis', method: 'Submission', round: 4, time: '3:18', card_position: 'main_event', card_type: 'main_card', weight_class: 'Middleweight', title_fight: true },
      { fight_id: 'ufc-305-holloway-volkanovski', fighter_a: 'Max Holloway', fighter_b: 'Alexander Volkanovski', winner: 'Max Holloway', method: 'Decision', round: 5, time: '5:00', card_position: 'main_card', card_type: 'main_card', weight_class: 'Featherweight', title_fight: true },
      { fight_id: 'ufc-305-romero-tab2', fighter_a: 'Kevin Holland', fighter_b: 'Reinier de Ridder', winner: 'Reinier de Ridder', method: 'Submission', round: 1, time: '4:22', card_position: 'main_card', card_type: 'main_card', weight_class: 'Middleweight', title_fight: false },
      { fight_id: 'ufc-305-hunt-lewis', fighter_a: 'Tai Tuivasa', fighter_b: 'Carlos Prates', winner: 'Carlos Prates', method: 'KO', round: 2, time: '3:01', card_position: 'main_card', card_type: 'main_card', weight_class: 'Heavyweight', title_fight: false },
    ]
  },
  {
    event_id: 'ufc-fight-night-245',
    name: 'UFC Fight Night 245',
    date: '2024-09-28',
    event_type: 'fight_night',
    fights: [
      { fight_id: 'ufcfn245-main-a', fighter_a: 'Islam Makhachev', fighter_b: 'Arman Tsarukyan', winner: 'Islam Makhachev', method: 'Decision', round: 5, time: '5:00', card_position: 'main_event', card_type: 'main_card', weight_class: 'Lightweight', title_fight: true },
      { fight_id: 'ufcfn245-main-b', fighter_a: 'Merab Dvalishvili', fighter_b: 'Umar Nurmagomedov', winner: 'Merab Dvalishvili', method: 'Decision', round: 5, time: '5:00', card_position: 'main_card', card_type: 'main_card', weight_class: 'Bantamweight', title_fight: false },
      { fight_id: 'ufcfn245-main-c', fighter_a: 'Tom Aspinall', fighter_b: 'Sergei Pavlovich', winner: 'Tom Aspinall', method: 'TKO', round: 1, time: '0:33', card_position: 'main_card', card_type: 'main_card', weight_class: 'Heavyweight', title_fight: false },
    ]
  }
];

export const mockPredictions: Prediction[] = [
  // MMA Guru - UFC 300
  { prediction_id: 'guru_ufc300_1', creator: 'mma_guru', event_id: 'ufc-300', fight_id: 'ufc-300-pereira-hill', video_id: 'abc1', predicted_winner: 'Alex Pereira', confidence: 'high', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_ufc300_2', creator: 'mma_guru', event_id: 'ufc-300', fight_id: 'ufc-300-holloway-gaethje', video_id: 'abc1', predicted_winner: 'Justin Gaethje', confidence: 'medium', correct: false, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_ufc300_3', creator: 'mma_guru', event_id: 'ufc-300', fight_id: 'ufc-300-poirier-saint-denis', video_id: 'abc1', predicted_winner: 'Dustin Poirier', confidence: 'high', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_ufc300_4', creator: 'mma_guru', event_id: 'ufc-300', fight_id: 'ufc-300-zhang-yan', video_id: 'abc1', predicted_winner: 'Zhang Weili', confidence: 'medium', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_ufc300_5', creator: 'mma_guru', event_id: 'ufc-300', fight_id: 'ufc-300-ankalaev-walker', video_id: 'abc1', predicted_winner: 'Magomed Ankalaev', confidence: 'high', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_ufc300_6', creator: 'mma_guru', event_id: 'ufc-300', fight_id: 'ufc-300-jiri-barboza', video_id: 'abc1', predicted_winner: 'Jiri Prochazka', confidence: 'medium', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_ufc300_7', creator: 'mma_guru', event_id: 'ufc-300', fight_id: 'ufc-300-pantoja-erceg', video_id: 'abc1', predicted_winner: null, confidence: 'pick_em', correct: null, prediction_changed: false, fight_skipped: false },

  // MMA Guru - UFC 299
  { prediction_id: 'guru_ufc299_1', creator: 'mma_guru', event_id: 'ufc-299', fight_id: 'ufc-299-omalley-vera', video_id: 'abc2', predicted_winner: "Sean O'Malley", confidence: 'high', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_ufc299_2', creator: 'mma_guru', event_id: 'ufc-299', fight_id: 'ufc-299-dustin-benson', video_id: 'abc2', predicted_winner: 'Dustin Poirier', confidence: 'medium', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_ufc299_3', creator: 'mma_guru', event_id: 'ufc-299', fight_id: 'ufc-299-romero-mcgregor', video_id: 'abc2', predicted_winner: 'Kevin Holland', confidence: 'medium', correct: false, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_ufc299_4', creator: 'mma_guru', event_id: 'ufc-299', fight_id: 'ufc-299-moicano-gamrot', video_id: 'abc2', predicted_winner: 'Renato Moicano', confidence: 'low', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_ufc299_5', creator: 'mma_guru', event_id: 'ufc-299', fight_id: 'ufc-299-strickland-du-plessis', video_id: 'abc2', predicted_winner: 'Sean Strickland', confidence: 'medium', correct: false, prediction_changed: false, fight_skipped: false },

  // MMA Guru - Fight Night 240
  { prediction_id: 'guru_fn240_1', creator: 'mma_guru', event_id: 'ufc-fight-night-240', fight_id: 'ufcfn240-santos-ankalaev', video_id: 'abc3', predicted_winner: 'Jamahal Hill', confidence: 'medium', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_fn240_2', creator: 'mma_guru', event_id: 'ufc-fight-night-240', fight_id: 'ufcfn240-rountree-spann', video_id: 'abc3', predicted_winner: 'Khalil Rountree', confidence: 'low', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_fn240_3', creator: 'mma_guru', event_id: 'ufc-fight-night-240', fight_id: 'ufcfn240-vettori-costa', video_id: 'abc3', predicted_winner: 'Paulo Costa', confidence: 'medium', correct: null, prediction_changed: false, fight_skipped: false },

  // MMA Guru - UFC 305
  { prediction_id: 'guru_ufc305_1', creator: 'mma_guru', event_id: 'ufc-305', fight_id: 'ufc-305-du-plessis-adesanya', video_id: 'abc4', predicted_winner: 'Israel Adesanya', confidence: 'medium', correct: false, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_ufc305_2', creator: 'mma_guru', event_id: 'ufc-305', fight_id: 'ufc-305-holloway-volkanovski', video_id: 'abc4', predicted_winner: 'Max Holloway', confidence: 'high', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_ufc305_3', creator: 'mma_guru', event_id: 'ufc-305', fight_id: 'ufc-305-romero-tab2', video_id: 'abc4', predicted_winner: 'Kevin Holland', confidence: 'low', correct: false, prediction_changed: false, fight_skipped: false },

  // MMA Guru - Fight Night 245
  { prediction_id: 'guru_fn245_1', creator: 'mma_guru', event_id: 'ufc-fight-night-245', fight_id: 'ufcfn245-main-a', video_id: 'abc5', predicted_winner: 'Islam Makhachev', confidence: 'high', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'guru_fn245_2', creator: 'mma_guru', event_id: 'ufc-fight-night-245', fight_id: 'ufcfn245-main-b', video_id: 'abc5', predicted_winner: 'Umar Nurmagomedov', confidence: 'medium', correct: false, prediction_changed: false, fight_skipped: false },

  // MMA Joey - UFC 300
  { prediction_id: 'joey_ufc300_1', creator: 'mma_joey', event_id: 'ufc-300', fight_id: 'ufc-300-pereira-hill', video_id: 'def1', predicted_winner: 'Alex Pereira', confidence: 'medium', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'joey_ufc300_2', creator: 'mma_joey', event_id: 'ufc-300', fight_id: 'ufc-300-holloway-gaethje', video_id: 'def1', predicted_winner: 'Max Holloway', confidence: 'low', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'joey_ufc300_3', creator: 'mma_joey', event_id: 'ufc-300', fight_id: 'ufc-300-poirier-saint-denis', video_id: 'def1', predicted_winner: 'Dustin Poirier', confidence: 'medium', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'joey_ufc300_4', creator: 'mma_joey', event_id: 'ufc-300', fight_id: 'ufc-300-zhang-yan', video_id: 'def1', predicted_winner: 'Zhang Weili', confidence: 'high', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'joey_ufc300_5', creator: 'mma_joey', event_id: 'ufc-300', fight_id: 'ufc-300-jiri-barboza', video_id: 'def1', predicted_winner: 'Edson Barboza', confidence: 'medium', correct: false, prediction_changed: false, fight_skipped: false },

  // MMA Joey - UFC 299
  { prediction_id: 'joey_ufc299_1', creator: 'mma_joey', event_id: 'ufc-299', fight_id: 'ufc-299-omalley-vera', video_id: 'def2', predicted_winner: 'Marlon Vera', confidence: 'medium', correct: false, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'joey_ufc299_2', creator: 'mma_joey', event_id: 'ufc-299', fight_id: 'ufc-299-dustin-benson', video_id: 'def2', predicted_winner: 'Dustin Poirier', confidence: 'high', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'joey_ufc299_3', creator: 'mma_joey', event_id: 'ufc-299', fight_id: 'ufc-299-strickland-du-plessis', video_id: 'def2', predicted_winner: 'Dricus Du Plessis', confidence: 'low', correct: true, prediction_changed: false, fight_skipped: false },

  // Joey UFC 305
  { prediction_id: 'joey_ufc305_1', creator: 'mma_joey', event_id: 'ufc-305', fight_id: 'ufc-305-du-plessis-adesanya', video_id: 'def3', predicted_winner: 'Dricus Du Plessis', confidence: 'medium', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'joey_ufc305_2', creator: 'mma_joey', event_id: 'ufc-305', fight_id: 'ufc-305-holloway-volkanovski', video_id: 'def3', predicted_winner: 'Alexander Volkanovski', confidence: 'medium', correct: false, prediction_changed: false, fight_skipped: false },

  // Sneaky MMA - UFC 300
  { prediction_id: 'sneaky_ufc300_1', creator: 'sneaky_mma', event_id: 'ufc-300', fight_id: 'ufc-300-pereira-hill', video_id: 'ghi1', predicted_winner: 'Alex Pereira', confidence: 'high', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'sneaky_ufc300_2', creator: 'sneaky_mma', event_id: 'ufc-300', fight_id: 'ufc-300-holloway-gaethje', video_id: 'ghi1', predicted_winner: 'Justin Gaethje', confidence: 'high', correct: false, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'sneaky_ufc300_3', creator: 'sneaky_mma', event_id: 'ufc-300', fight_id: 'ufc-300-poirier-saint-denis', video_id: 'ghi1', predicted_winner: 'Dustin Poirier', confidence: 'medium', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'sneaky_ufc300_4', creator: 'sneaky_mma', event_id: 'ufc-300', fight_id: 'ufc-300-zhang-yan', video_id: 'ghi1', predicted_winner: 'Yan Xiaonan', confidence: 'low', correct: false, prediction_changed: false, fight_skipped: false },

  // Sneaky UFC 305
  { prediction_id: 'sneaky_ufc305_1', creator: 'sneaky_mma', event_id: 'ufc-305', fight_id: 'ufc-305-du-plessis-adesanya', video_id: 'ghi2', predicted_winner: 'Dricus Du Plessis', confidence: 'high', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'sneaky_ufc305_2', creator: 'sneaky_mma', event_id: 'ufc-305', fight_id: 'ufc-305-holloway-volkanovski', video_id: 'ghi2', predicted_winner: 'Max Holloway', confidence: 'medium', correct: true, prediction_changed: false, fight_skipped: false },
  { prediction_id: 'sneaky_ufc305_3', creator: 'sneaky_mma', event_id: 'ufc-305', fight_id: 'ufc-305-hunt-lewis', video_id: 'ghi2', predicted_winner: 'Carlos Prates', confidence: 'medium', correct: true, prediction_changed: false, fight_skipped: false },
];

export const mockFlagged: FlaggedPrediction[] = [
  {
    flag_id: 'flag_001',
    creator: 'mma_guru',
    event_id: 'ufc-300',
    fight_id: 'ufc-300-sterling-sandhagen',
    video_id: 'abc1',
    ambiguity_reason: 'Creator mentioned both fighters winning in different contexts',
    raw_excerpt: '"I think Aljo gets it done...actually Sterling might struggle here"',
    suggested_winner: 'Aljamain Sterling',
    confidence_in_suggestion: 'low',
    status: 'pending_review',
    manually_resolved: false,
    resolved_winner: null
  }
];
