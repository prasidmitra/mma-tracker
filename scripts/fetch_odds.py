#!/usr/bin/env python3
"""
Fetch closing moneyline odds from bestfightodds.com for all UFC events.
Writes odds_favorite and odds_ml into each fight in data/events.json.
Incremental — skips fights that already have the odds_favorite key set.
Caches raw HTML in tmp/odds_cache/ to avoid re-fetching.
"""

import json
import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from statistics import median

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).parent.parent
EVENTS_FILE = ROOT / "data" / "events.json"
FIGHTERS_FILE = ROOT / "data" / "fighters.json"
CACHE_DIR = ROOT / "tmp" / "odds_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

BASE = "https://www.bestfightodds.com"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
ODDS_RE = re.compile(r"([+-]\d{2,4})")

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


# ── Name normalisation ────────────────────────────────────────────────────────

def build_alias_map(fighters: dict) -> dict[str, str]:
    """Return lowercase alias/name → canonical name."""
    lookup: dict[str, str] = {}
    for canonical, aliases in fighters.items():
        lookup[canonical.lower()] = canonical
        for alias in aliases:
            if alias:
                lookup[alias.lower()] = canonical
    return lookup


def normalise(name: str, alias_map: dict[str, str], card_names: list[str]) -> str | None:
    """Map a BFO name to a canonical name from our fight card."""
    name = name.strip()
    # 1. exact match against card
    for cn in card_names:
        if cn.lower() == name.lower():
            return cn
    # 2. alias lookup
    canon = alias_map.get(name.lower())
    if canon and canon in card_names:
        return canon
    # 3. last-name match against card
    last = name.split()[-1].lower()
    for cn in card_names:
        if cn.split()[-1].lower() == last:
            return cn
    return None


# ── HTTP helpers ──────────────────────────────────────────────────────────────

def fetch_html(url: str, cache_key: str) -> str:
    cache_file = CACHE_DIR / f"{cache_key}.html"
    if cache_file.exists():
        return cache_file.read_text(encoding="utf-8")
    time.sleep(1)
    resp = SESSION.get(url, timeout=30)
    resp.raise_for_status()
    cache_file.write_text(resp.text, encoding="utf-8")
    return resp.text


def extract_bfo_date(html: str) -> datetime | None:
    """Extract the event date from a BFO event page via JSON-LD startDate."""
    m = re.search(r'"startDate"\s*:\s*"(\d{4}-\d{2}-\d{2})"', html)
    if m:
        try:
            return datetime.strptime(m.group(1), "%Y-%m-%d")
        except ValueError:
            pass
    return None


def search_event(query: str, card_names: list[str], event_date: str) -> tuple[str, str] | None:
    """Search BFO and return (url, name) of the best-matching UFC result, or None.
    Verifies the found event's date is within 4 days of our event date AND shares
    at least one fighter last name with our card (belt-and-suspenders check)."""
    html = fetch_html(f"{BASE}/search?query={requests.utils.quote(query)}", f"search_{query.replace(' ', '_')}")
    soup = BeautifulSoup(html, "lxml")
    card_lastnames = {n.split()[-1].lower() for n in card_names}
    our_date = datetime.strptime(event_date, "%Y-%m-%d")

    for a in soup.select("a[href*='/events/']"):
        href = a["href"]
        name = a.get_text(strip=True)
        if not ("ufc" in href.lower() or "ufc" in name.lower()):
            continue
        url = f"{BASE}{href}"
        slug = href.strip("/").split("/")[-1]
        try:
            event_html = fetch_html(url, f"event_{slug}")
        except Exception:
            continue
        # Date check — must be within 4 days of our event
        bfo_date = extract_bfo_date(event_html)
        if bfo_date is None or abs((bfo_date - our_date).days) > 4:
            continue
        # Fighter overlap check
        esoup = BeautifulSoup(event_html, "lxml")
        bfo_names = {span.get_text(strip=True).split()[-1].lower()
                     for span in esoup.select("span.t-b-fcc")}
        if card_lastnames & bfo_names:
            return url, name
    return None


# ── Odds parsing ──────────────────────────────────────────────────────────────

def parse_matchups(html: str) -> list[dict]:
    """
    Return list of {f1, f2, f1_odds, f2_odds} from a BFO event page.
    Uses parallel table approach: table[0] = names, table[1] = odds.
    """
    soup = BeautifulSoup(html, "lxml")
    tables = soup.find_all("table")
    if len(tables) < 2:
        return []

    t1_rows = tables[0].find_all("tr")
    t2_rows = tables[1].find_all("tr")

    def row_odds(row) -> list[int]:
        vals = []
        for td in row.find_all("td"):
            m = ODDS_RE.match(td.get_text(strip=True))
            if m:
                vals.append(int(m.group(1)))
        return vals

    matchups = []
    i = 0
    while i < len(t1_rows) and i < len(t2_rows):
        r1 = t1_rows[i]
        # skip prop rows
        if t2_rows[i].get("class") == ["pr"]:
            i += 1
            continue
        if r1.get("id", "").startswith("mu-"):
            f1 = r1.select_one("span.t-b-fcc")
            f1_odds = row_odds(t2_rows[i])
            if i + 1 < len(t1_rows):
                f2 = t1_rows[i + 1].select_one("span.t-b-fcc")
                f2_odds = row_odds(t2_rows[i + 1])
                if f1 and f2:
                    matchups.append({
                        "f1": f1.get_text(strip=True),
                        "f2": f2.get_text(strip=True),
                        "f1_odds": f1_odds,
                        "f2_odds": f2_odds,
                    })
            i += 2
        else:
            i += 1
    return matchups


def determine_favorite(m: dict) -> tuple[str, str, int] | None:
    """
    Return (f1_name, f2_name, favorite_ml) where favorite_ml is negative.
    Uses median of all available odds to pick the consensus favorite.
    Returns None if no odds available for either fighter.
    """
    o1 = m["f1_odds"]
    o2 = m["f2_odds"]
    if not o1 and not o2:
        return None
    med1 = median(o1) if o1 else 9999
    med2 = median(o2) if o2 else 9999
    if med1 < med2:
        return m["f1"], m["f2"], int(median(o1))
    else:
        return m["f2"], m["f1"], int(median(o2))


# ── Search query construction ─────────────────────────────────────────────────

def main_event_query(event: dict) -> str | None:
    """Return a search query using the main event fighters' last names."""
    main = next((f for f in event["fights"] if f.get("card_position") == "main_event"), None)
    if not main:
        return None
    a_last = main["fighter_a"].split()[-1]
    b_last = main["fighter_b"].split()[-1]
    return f"{a_last} {b_last}"


def make_search_queries(event: dict) -> list[str]:
    """Return ordered list of search queries to try for this event."""
    name = event["name"]
    queries: list[str] = []
    # Numbered UFC events: try "UFC 300" first
    m = re.match(r"(UFC\s+\d+)\b", name, re.I)
    if m:
        queries.append(m.group(1))
    # Always add main-event fighter last names as a fallback (or primary for Fight Night)
    me = main_event_query(event)
    if me:
        queries.append(me)
    # Last resort: strip colon and vs, use full name words
    stripped = re.sub(r":\s+", " ", name)
    stripped = re.sub(r"\s+vs\.?\s+", " ", stripped, flags=re.I)
    stripped = stripped.strip()
    if stripped not in queries:
        queries.append(stripped)
    return queries


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    events: list[dict] = json.loads(EVENTS_FILE.read_text())
    fighters: dict = json.loads(FIGHTERS_FILE.read_text())
    alias_map = build_alias_map(fighters)

    total_updated = 0
    total_unmatched = 0
    unmatched_log: list[str] = []

    for event in events:
        # Check if any fight in this event still needs odds
        needs_odds = [f for f in event["fights"] if "odds_favorite" not in f]
        if not needs_odds:
            continue

        queries = make_search_queries(event)
        card_names = list({f for fight in event["fights"] for f in [fight["fighter_a"], fight["fighter_b"]]})
        print(f"\n{'─'*60}")
        print(f"Event: {event['name']} ({event['date']})")

        result = None
        for query in queries:
            print(f"  trying query='{query}'")
            result = search_event(query, card_names, event["date"])
            if result:
                break
        if not result:
            print(f"  ✗  No BFO event found — marking all fights as null")
            for fight in needs_odds:
                fight["odds_favorite"] = None
                fight["odds_ml"] = None
            continue

        bfo_url, bfo_name = result
        bfo_slug = bfo_url.rstrip("/").split("/")[-1]
        print(f"  → BFO: {bfo_name}  ({bfo_url})")

        try:
            html = fetch_html(bfo_url, f"event_{bfo_slug}")
        except Exception as e:
            print(f"  ✗  Fetch failed: {e}")
            continue

        matchups = parse_matchups(html)
        print(f"  Parsed {len(matchups)} matchups from BFO page")

        # Match BFO matchups to our fights
        for fight in needs_odds:
            fa, fb = fight["fighter_a"], fight["fighter_b"]
            matched = False

            for m in matchups:
                cn_f1 = normalise(m["f1"], alias_map, card_names)
                cn_f2 = normalise(m["f2"], alias_map, card_names)
                if cn_f1 is None or cn_f2 is None:
                    continue
                # Check if these normalised names match our fight
                card_pair = {fa, fb}
                bfo_pair = {cn_f1, cn_f2}
                if card_pair == bfo_pair:
                    result2 = determine_favorite(m)
                    if result2:
                        fav_bfo, _, fav_ml = result2
                        fav_canon = normalise(fav_bfo, alias_map, card_names)
                        fight["odds_favorite"] = fav_canon
                        fight["odds_ml"] = fav_ml
                        print(f"  ✓  {fa} vs {fb} → fav: {fav_canon} ({fav_ml})")
                    else:
                        fight["odds_favorite"] = None
                        fight["odds_ml"] = None
                        print(f"  –  {fa} vs {fb}: no odds data")
                    total_updated += 1
                    matched = True
                    break

            if not matched:
                fight["odds_favorite"] = None
                fight["odds_ml"] = None
                msg = f"  ✗  UNMATCHED: {fa} vs {fb} in {event['name']}"
                print(msg)
                unmatched_log.append(msg)
                total_unmatched += 1

    EVENTS_FILE.write_text(json.dumps(events, indent=2, ensure_ascii=False))
    print(f"\n{'='*60}")
    print(f"Done. Updated {total_updated} fights. Unmatched: {total_unmatched}")
    if unmatched_log:
        print("\nUnmatched fights (review manually):")
        for line in unmatched_log:
            print(line)


if __name__ == "__main__":
    main()
