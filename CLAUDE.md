# MMA Predictor Accuracy Tracker

## Git & GitHub
- Remote: git@github.com:prasidmitra/mma-tracker.git (SSH — HTTPS auth doesn't work in this env)
- Do NOT commit or push unless the user explicitly says "push changes" or asks for a commit/push.
- Use descriptive commit messages. Co-author line is required (see below).
- Commit format:
  ```
  git commit -m "$(cat <<'EOF'
  <summary>

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

## What This Project Is
A website that tracks and displays the prediction accuracy of famous MMA YouTube
personalities. Users can filter by creator, event type, date range, and card
position to see who actually knows their stuff vs who just sounds confident.

## Target Creators
1. MMA Guru (channel: @TheMMAGuru)
2. MMA Joey (channel: @MMAJoey)
3. Sneaky MMA (channel: @SneakyMMA)
4. Brendan Schaub (channel: @BrendanSchaubPodcast or similar)
5. Luke Thomas / Morning Kombat (channel: @LukeThomas)
6. The Weasel (search YouTube for "The Weasel MMA" predictions)
7. Bedtime MMA (search YouTube for "Bedtime MMA" predictions)
8. Lucas Tracy MMA (search YouTube for "Lucas Tracy MMA" predictions)

## CSV Exports — Run After Every Data Update
Whenever any prediction data changes (pipeline run, manual correction, new creator added),
always run the export script immediately after:

```bash
source venv/bin/activate && python scripts/export_to_csv.py
```

This regenerates all five CSVs in `data/exports/`:
- `predictions_all.csv`   — one row per prediction (all creators)
- `accuracy_summary.csv`  — one row per creator with overall stats
- `flagged.csv`           — all ambiguous/pending predictions
- `fights_by_creator.csv` — long format: one row per (fight × creator)
- `fights_all_creators.csv` — wide format: one row per fight, all creator picks as columns

Commit and push the updated CSVs alongside the JSON data changes.

## Architecture — Static JSON, No Backend
This project follows the covid19india.org architecture pattern:
- ALL data lives as static JSON files in /data directory
- NO database, NO backend server, NO API
- GitHub Pages serves the static files via CDN
- React frontend loads JSON once and handles ALL filtering client-side
- GitHub Actions runs the scrape pipeline when triggered manually or on schedule
- Total infra cost: $0

## Data Storage Structure
```
/data
  events.json          ← all UFC events + fight results (ground truth)
  fighters.json        ← fighter canonical names + all known aliases/nicknames
  predictions/
    mma_guru.json
    mma_joey.json
    sneaky_mma.json
    brendan_schaub.json
    luke_thomas.json
    the_weasel.json
    bedtime_mma.json
    lucas_tracy_mma.json
  flagged.json         ← ambiguous predictions needing manual review
  video_manifest.json  ← processing log, one entry per video
/src                   ← React frontend
/scripts               ← Python scraping pipeline
```

## Core Data Schemas

### events.json
```json
[
  {
    "event_id": "ufc-300",
    "name": "UFC 300",
    "date": "2024-04-13",
    "fights": [
      {
        "fight_id": "ufc-300-pereira-hill",
        "fighter_a": "Alex Pereira",
        "fighter_b": "Jamahal Hill",
        "winner": "Alex Pereira",
        "method": "KO",
        "round": 1,
        "time": "1:54",
        "card_position": "main_event",
        "card_type": "main_card",
        "weight_class": "Light Heavyweight",
        "title_fight": true
      }
    ]
  }
]
```

### predictions/{creator}.json
```json
[
  {
    "prediction_id": "mma_guru_ufc300_pereira_hill",
    "creator": "mma_guru",
    "event_id": "ufc-300",
    "fight_id": "ufc-300-pereira-hill",
    "video_id": "youtubeVideoId",
    "predicted_winner": "Alex Pereira",
    "confidence": "high",
    "correct": true,
    "prediction_changed": false,
    "fight_skipped": false
  }
]
```

### flagged.json
```json
[
  {
    "flag_id": "flag_001",
    "creator": "mma_guru",
    "event_id": "ufc-300",
    "fight_id": "ufc-300-pereira-hill",
    "video_id": "youtubeVideoId",
    "ambiguity_reason": "Creator mentioned both fighters winning in different contexts",
    "raw_excerpt": "...exact words from transcript...",
    "suggested_winner": "Alex Pereira",
    "confidence_in_suggestion": "low",
    "status": "pending_review",
    "manually_resolved": false,
    "resolved_winner": null
  }
]
```

### video_manifest.json
```json
[
  {
    "creator": "mma_guru",
    "event_id": "ufc-300",
    "video_id": "youtubeVideoId",
    "title": "UFC 300 Full Card Predictions",
    "published_at": "2024-04-11",
    "status": "completed",
    "predictions_extracted": 13,
    "flagged_count": 1,
    "skipped_count": 0,
    "processed_at": "2024-04-12T10:00:00Z"
  }
]
```

## Creator Channel Discovery
For well-known creators (MMA Guru, Joey, Sneaky, Schaub, Luke Thomas) the
channel IDs are known. For the three newer/smaller creators below, the pipeline
must search YouTube Data API to find and confirm the correct channel before
scraping. Use the channel with the most UFC prediction videos as the canonical one.

```python
CREATORS = {
    "mma_guru": {
        "channel_id": "UCsEfOPMSQAWMCFjPuTSMhCQ",
        "display_name": "MMA Guru",
        "search_terms": ["UFC", "predictions", "preview", "breakdown"]
    },
    "mma_joey": {
        "channel_id": None,  # discover via YouTube search
        "display_name": "MMA Joey",
        "search_terms": ["UFC", "predictions", "picks"]
    },
    "sneaky_mma": {
        "channel_id": None,
        "display_name": "Sneaky MMA",
        "search_terms": ["UFC", "predictions"]
    },
    "brendan_schaub": {
        "channel_id": None,
        "display_name": "Brendan Schaub",
        "search_terms": ["UFC", "predictions", "picks", "preview"]
    },
    "luke_thomas": {
        "channel_id": None,
        "display_name": "Luke Thomas",
        "search_terms": ["UFC", "predictions", "picks"]
    },
    "the_weasel": {
        "channel_id": None,
        "display_name": "The Weasel",
        "search_terms": ["UFC", "predictions", "picks", "preview"]
    },
    "bedtime_mma": {
        "channel_id": None,
        "display_name": "Bedtime MMA",
        "search_terms": ["UFC", "predictions", "picks"]
    },
    "lucas_tracy_mma": {
        "channel_id": None,
        "display_name": "Lucas Tracy MMA",
        "search_terms": ["UFC", "predictions", "picks", "breakdown"]
    }
}
```

## Python Environment
- Always use the virtualenv at `venv/` in the project root
- Activate before running any Python: `source venv/bin/activate`
- Install all packages into the venv: `source venv/bin/activate && pip install ...`
- Never use the system Python or pip directly

## Python Stack
- Python 3.11+
- requests + beautifulsoup4 (ufcstats scraping)
- google-api-python-client (YouTube Data API v3)
- youtube-transcript-api (transcript fetching, no auth needed)
- anthropic (Claude API for prediction parsing)
- python-dotenv (env vars)

## Environment Variables Needed
```
ANTHROPIC_API_KEY=sk-ant-...
YOUTUBE_API_KEY=...        # from Google Cloud Console, free tier
```

## Key Rules
- NEVER store transcripts permanently. Process and discard.
- NEVER calculate accuracy on flagged/pending predictions
- NEVER calculate accuracy on pick_em predictions (predicted_winner: null)
- NEVER calculate accuracy on cancelled fights
- Missing prediction videos = excluded from accuracy, not counted as wrong
- All date ranges: last 10 years from today
- Always use Claude Haiku for bulk parsing (cheapest), Sonnet for ambiguous re-passes
- For creators without a known channel_id, always confirm the channel is correct
  by checking video titles before bulk scraping — do not assume

## Fighter Alias Table
```python
KNOWN_NICKNAMES = {
    "Alex Pereira": ["Poatan"],
    "Dustin Poirier": ["Blessed"],
    "Justin Gaethje": ["The Highlight"],
    "Conor McGregor": ["The Notorious"],
    "Jon Jones": ["Bones"],
    "Israel Adesanya": ["The Last Stylebender", "Izzy", "Stylebender"],
    "Sean O'Malley": ["Suga", "Sugar", "Suga Sean"],
    "Paddy Pimblett": ["The Baddy", "Paddy"],
    "Khamzat Chimaev": ["Borz"],
    "Belal Muhammad": ["Remember The Name"],
    "Leon Edwards": ["Rocky"],
    "Max Holloway": ["Blessed"],
    "Charles Oliveira": ["Do Bronx"],
    "Michael Chandler": ["Iron"],
    "Tony Ferguson": ["El Cucuy"],
    "Colby Covington": ["Chaos"],
    "Jorge Masvidal": ["Gamebred"],
    "Gilbert Burns": ["Durinho"],
    "Kamaru Usman": ["The Nigerian Nightmare"],
    "Robert Whittaker": ["The Reaper", "Bobby Knuckles"],
    "Marvin Vettori": ["The Italian Dream"],
    "Sean Strickland": ["Tarzan"],
    "Dricus Du Plessis": ["Stillknocks", "DDP"],
    "Tom Aspinall": ["Aspinall"],
    "Ciryl Gane": ["Bon Gamin"],
    "Curtis Blaydes": ["Razor"],
    "Derrick Lewis": ["The Black Beast"],
    "Stipe Miocic": ["Stipe"],
    "Francis Ngannou": ["The Predator"],
    "Valentina Shevchenko": ["Bullet"],
    "Amanda Nunes": ["The Lioness"],
    "Zhang Weili": ["Magnum"],
    "Aljamain Sterling": ["Funk Master", "Aljo"],
    "Merab Dvalishvili": ["The Machine"],
    "Henry Cejudo": ["Triple C"],
    "Jose Aldo": ["Junior"],
    "Yair Rodriguez": ["El Pantera"],
    "Brian Ortega": ["T-City"],
    "Alexander Volkanovski": ["The Great", "Volk"],
    "Dan Hooker": ["The Hangman"],
    "Arnold Allen": ["Almighty"],
    "Islam Makhachev": [],
    "Sergei Pavlovich": [],
    "Alexa Grasso": [],
    "Movsar Evloev": ["Immortal"]
}
```

## Claude Parsing Prompt Architecture

### System Prompt (used for every parse call)
```
You are extracting UFC fight predictions from a YouTube video transcript.
You are precise, literal, and conservative — when in doubt, you flag rather than guess.

You will receive:
1. The transcript of a UFC prediction video
2. The exact fight card for that event (you must only predict fights on this card)
3. A fighter alias/nickname lookup table

YOUR TASK: For each fight on the provided card, find the section of the transcript
where the creator discusses that fight and determine their final predicted winner.

CRITICAL RULES:
- Only predict fights explicitly on the provided fight card. Do not invent fights.
- The FINAL prediction is what matters. If they change their mind, use the last pick.
- A prediction requires clear intent to pick a winner. Analysis without a pick = skipped.
- When using nicknames, verify against the alias table. If a name doesn't match
  any fighter on the card unambiguously, flag it.
- Return ONLY valid JSON, no markdown, no explanation text outside the JSON.

CONFIDENCE LEVELS:
- "high": creator expresses clear certainty ("easily", "no doubt", "dominant")
- "medium": standard pick ("I'm going with X", "I think X wins", "X gets it done")
- "low": lean or slight edge ("slight edge to X", "I lean X but close", "tough one")
- "pick_em": explicitly says too close to call, coin flip, or refuses to pick
- "not_found": creator never discusses this fight in the video

PREDICTION_CHANGED: Set to true if the creator explicitly reverses their pick
("actually no...", "you know what, I'm flipping...", "changed my mind")

AMBIGUITY TRIGGERS — set ambiguous:true if ANY of these apply:
- A nickname maps to multiple fighters on the card
- Creator discusses the same fight twice with contradictory picks and no clear final
- Transcript quality is so poor the fighter names are garbled beyond recognition
- Creator's phrasing is genuinely unclear even in context (not just hedged)
- Auto-generated captions have clearly mangled a fighter name

Do NOT flag things that are merely uncertain — only flag genuine ambiguity.

FIGHT_SKIPPED: Set to true if creator never discusses this fight at all, or
explicitly skips it.
```

### Response Schema (one object per fight on the card)
```json
{
  "fight_id": "exact fight_id from the card",
  "fighter_a": "exact canonical name from card",
  "fighter_b": "exact canonical name from card",
  "predicted_winner": "exact canonical name or null if pick_em/not_found/skipped",
  "confidence": "high|medium|low|pick_em|not_found",
  "raw_excerpt": "exact words (max 100 chars) that led to this prediction",
  "prediction_changed": false,
  "final_prediction_note": null,
  "ambiguous": false,
  "ambiguity_reason": null,
  "fight_skipped": false
}
```

### Model Selection
- Pass 1: Claude Haiku for all videos (cost-efficient bulk processing)
- Pass 2: Re-run only ambiguous predictions with Claude Sonnet for better resolution
- Truncate transcripts longer than 12,000 words before sending
- Only send aliases for fighters on that specific event card, not the full table

## Accuracy Calculation Rules
Predictions are EXCLUDED from accuracy (correct = null) when:
- fight['winner'] is null (cancelled, no-contest, draw)
- predicted_winner is null (pick_em)
- ambiguous is true and manually_resolved is false
- fight_skipped is true

Accuracy = correct_predictions / eligible_predictions
where eligible = total - excluded
