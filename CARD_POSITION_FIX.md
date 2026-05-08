# Card Position Fix — TODO

## Problem

The current `assign_card_positions()` heuristic in `scripts/scrape_ufc_results.py` assumes every
UFC event has exactly 5 main card fights (indices 0-4 = main card, 5-8 = prelim, 9+ = early prelim).
This is wrong for events where the main card has 4 or 6+ fights.

**Concrete example:** UFC 300 main card actually had 6 fights (Pereira-Hill, Zhang-Yan, Holloway-Gaethje,
Tsarukyan-Oliveira, Sterling-Kattar, Prochazka-Rakic), but the heuristic caps at 5 — so
Prochazka-Rakic and Sterling-Kattar are incorrectly tagged as `prelim` in `data/events.json`.

The fight card filter on the frontend (Sidebar → "Main Card") uses `card_position` from `events.json`
as the source of truth. Predictions look up `card_position` via `fight_id` → event, so fixing
`events.json` is the only change needed — no prediction JSON changes required.

## What Was Already Tried

### Attempt 1: UFCStats section headers
Investigated whether UFCStats event pages (`http://ufcstats.com/event-details/<hash>`) have HTML
section separators between main card / prelim / early prelim fights.

**Result: UFCStats has no section data.** Every event is a single flat `<table>` with one column
header row and N fight rows. No "Main Card", "Preliminary Card" separators exist anywhere in the HTML.

Script written: `scripts/fix_card_positions.py`
- Fetches the UFCStats events list to build `{event_id → url}` mapping
- Re-scrapes all 417 events with section-aware parsing
- Falls back to heuristic when no sections detected (which is always)
- Result: 0 fights updated — section detection never fires, heuristic gives same output as existing data

The scraper (`scripts/scrape_ufc_results.py`) was also updated during this work:
- `parse_event_page()` now tries section detection before falling back to heuristic
- `assign_card_positions_from_sections()` added alongside original `assign_card_positions()`
- `run()` now stores the `url` field in each event dict (useful for future re-scraping)
- These changes are committed and harmless — they just don't help since UFCStats has no section data

## Solution: Wikipedia Scraping

Wikipedia UFC event articles reliably separate fights by broadcast section. Each article has:

```html
<h3 id="Main_card">Main card</h3>
<table class="wikitable">
  <!-- rows: fighter_a, fighter_b, method, round, time -->
</table>

<h3 id="Preliminary_card">Preliminary card</h3>
<table class="wikitable">...</table>

<h3 id="Early_preliminary_card">Early preliminary card</h3>   <!-- for larger cards -->
<table class="wikitable">...</table>
```

### Implementation Plan

1. **URL mapping**: For each event in `events.json`, find the Wikipedia article URL.
   - Numbered PPVs: straightforward — "UFC 300" → `https://en.wikipedia.org/wiki/UFC_300`
   - Fight Nights: "UFC Fight Night: Covington vs. Buckley" → needs fuzzy match
   - Use the Wikipedia search API to resolve names:
     `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=UFC+Fight+Night+Covington+Buckley&format=json`
   - Cache the name→URL mapping to avoid repeated API calls

2. **Parse each Wikipedia article**:
   - Find `<h2>`/`<h3>` elements containing "Main card", "Preliminary card", "Early preliminary"
   - For each section header, collect the next `<table class="wikitable">` fight rows
   - Extract fighter names from table cells
   - Build `{(last_a, last_b) → section}` lookup

3. **Match fighters to events.json**:
   - For each fight in `events.json`, compute `key = sorted([last_a, last_b])`
   - Look up section from Wikipedia table
   - Assign `card_position` / `card_type` from section + index within section
   - Log any unmatched fights (name discrepancies) for manual review

4. **Write updated `events.json`**

### Gotchas to Watch For

- Some Wikipedia fight tables list fighters in reverse order or use different name formatting
- Event name variations: "UFC on ESPN+", "UFC on FOX", "The Ultimate Fighter ... Finale" events
  may have non-standard Wikipedia article titles
- A small number of very old events (pre-2018) may have incomplete or differently structured Wikipedia articles
- Wikipedia fighter names may differ from UFCStats names (e.g. "Jiří Procházka" vs "Jiri Prochazka") —
  use last-name-only keys for matching, not full names
- The script should log all unmatched fights so they can be reviewed manually if needed

### Files to Create / Modify

- **New**: `scripts/fix_card_positions_wikipedia.py` — standalone backfill script
- **No frontend changes needed** — `events.json` is the only source of truth for `card_position`
- **No prediction JSON changes needed** — predictions reference `fight_id`, look up card position from events

### Verification

After running the fix, check these known-wrong examples:
```python
# UFC 300: Prochazka-Rakic and Sterling-Kattar should be main_card (PPV)
# UFC Fight Night: Covington vs. Buckley: 5-fight main card → heuristic was already correct here
python3 -c "
import json
events = json.load(open('data/events.json'))
for name in ['ufc-300']:
    ev = next(e for e in events if e['event_id'] == name)
    print(ev['name'])
    for f in ev['fights']:
        print(f'  [{f[\"card_position\"]}] {f[\"fighter_a\"]} vs {f[\"fighter_b\"]}')
"
```

Expected after fix:
- UFC 300: Pereira-Hill (main_event), Zhang-Yan (co_main), Holloway-Gaethje (main_card),
  Tsarukyan-Oliveira (main_card), Prochazka-Rakic (main_card), Sterling-Kattar (main_card),
  then prelims starting with Harrison-Holm
