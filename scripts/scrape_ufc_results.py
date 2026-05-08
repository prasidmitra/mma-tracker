#!/usr/bin/env python3
"""Scrape UFC event results from ufcstats.com for the last 10 years (incremental)."""

import json
import re
import time
import sys
from datetime import datetime, date, timedelta
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE_URL = "http://ufcstats.com"
EVENTS_URL = f"{BASE_URL}/statistics/events/completed?page=all"
DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_FILE = DATA_DIR / "events.json"

SESSION = requests.Session()
SESSION.headers["User-Agent"] = (
    "Mozilla/5.0 (compatible; MMATrackerBot/1.0; academic research)"
)


def fetch(url: str, retries: int = 3) -> BeautifulSoup:
    for attempt in range(retries):
        try:
            resp = SESSION.get(url, timeout=30)
            resp.raise_for_status()
            return BeautifulSoup(resp.text, "lxml")
        except requests.RequestException as e:
            if attempt == retries - 1:
                raise
            wait = 2 ** attempt
            print(f"  Retry {attempt + 1}/{retries} for {url} (error: {e}), waiting {wait}s")
            time.sleep(wait)


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def make_event_id(name: str) -> str:
    # "UFC 300: ..." → "ufc-300"
    # "UFC Fight Night: Poirier vs. Gaethje" → "ufc-fight-night-poirier-vs-gaethje"
    # "UFC - Road to UFC 4.6" → "ufc-road-to-ufc-4-6"
    name = name.strip()
    m = re.match(r"UFC\s+(\d+)\b", name, re.I)
    if m:
        return f"ufc-{m.group(1)}"
    name = re.sub(r":\s+", " ", name)
    return slugify(name)


def make_fight_id(event_id: str, fighter_a: str, fighter_b: str) -> str:
    # Use last names sorted alphabetically for consistency
    last_a = fighter_a.strip().split()[-1].lower()
    last_b = fighter_b.strip().split()[-1].lower()
    names = sorted([last_a, last_b])
    return f"{event_id}-{names[0]}-{names[1]}"


def assign_card_positions(fights: list[dict]) -> list[dict]:
    """Index-based heuristic fallback. Assumes 5-fight main card."""
    n = len(fights)
    for i, fight in enumerate(fights):
        if i < 5:
            fight["card_type"] = "main_card"
            if i == 0:
                fight["card_position"] = "main_event"
            elif i == 1:
                fight["card_position"] = "co_main"
            else:
                fight["card_position"] = "main_card"
        elif i < 9:
            fight["card_type"] = "prelim"
            fight["card_position"] = "prelim"
        else:
            fight["card_type"] = "early_prelim"
            fight["card_position"] = "early_prelim"

    if n <= 2:
        for i, f in enumerate(fights):
            f["card_type"] = "main_card"
            f["card_position"] = "main_event" if i == 0 else "co_main"
    elif n <= 5:
        for i, f in enumerate(fights):
            f["card_type"] = "main_card"
            if i == 0:
                f["card_position"] = "main_event"
            elif i == 1:
                f["card_position"] = "co_main"
            else:
                f["card_position"] = "main_card"

    return fights


_SECTION_KEYWORDS = {
    "main card": "main_card",
    "preliminary card": "prelim",
    "early preliminary": "early_prelim",
}


def assign_card_positions_from_sections(fights: list[dict]) -> list[dict]:
    """Use the _section field written by parse_event_page; fall back to index heuristic."""
    has_sections = any(f.get("_section", "main_card") != "main_card" for f in fights)

    if not has_sections:
        for f in fights:
            f.pop("_section", None)
        return assign_card_positions(fights)

    section_counts: dict[str, int] = {}
    for f in fights:
        section = f.pop("_section", "main_card")
        idx = section_counts.get(section, 0)
        section_counts[section] = idx + 1

        if section == "main_card":
            f["card_type"] = "main_card"
            f["card_position"] = "main_event" if idx == 0 else "co_main" if idx == 1 else "main_card"
        elif section == "prelim":
            f["card_type"] = "prelim"
            f["card_position"] = "prelim"
        else:
            f["card_type"] = "early_prelim"
            f["card_position"] = "early_prelim"

    return fights


def parse_method(col7: "BeautifulSoup") -> str | None:
    """Extract the method string from method column."""
    paras = col7.find_all("p")
    if not paras:
        return None
    raw = paras[0].get_text(strip=True)
    # Normalize to standard labels
    mapping = {
        "KO/TKO": "KO/TKO",
        "SUB": "SUB",
        "U-DEC": "DEC",
        "S-DEC": "DEC",
        "M-DEC": "DEC",
        "DQ": "DQ",
        "NC": "NC",
        "DRAW": "DRAW",
    }
    for k, v in mapping.items():
        if k in raw:
            return v
    return raw or None


def parse_event_page(event_url: str, event_id: str) -> list[dict]:
    soup = fetch(event_url)
    fights = []

    # Walk all rows in the fight table; non-hover rows may be section headers
    fight_table = soup.find("table", class_=re.compile(r"b-fight-details__table"))
    if fight_table:
        all_rows = fight_table.find_all("tr")
    else:
        all_rows = soup.find_all("tr", class_="b-fight-details__table-row__hover")

    current_section = "main_card"
    for row in all_rows:
        row_classes = row.get("class", [])
        if "b-fight-details__table-row__hover" not in row_classes:
            row_text = row.get_text(separator=" ", strip=True).lower()
            for kw, section in _SECTION_KEYWORDS.items():
                if kw in row_text:
                    current_section = section
                    break
            continue

        cols = row.find_all("td")
        if len(cols) < 10:
            continue

        # --- Winner detection ---
        # Col 0: flag anchor, green = winner (first fighter), bordered = draw/nc/no winner
        flag_a = cols[0].find("a", class_="b-flag")
        flag_class = " ".join(flag_a.get("class", [])) if flag_a else ""
        first_fighter_won = "b-flag_style_green" in flag_class

        # --- Fighter names (col 1) ---
        fighter_links = cols[1].find_all("a")
        if len(fighter_links) < 2:
            continue
        fighter_a = fighter_links[0].get_text(strip=True)
        fighter_b = fighter_links[1].get_text(strip=True)

        # --- Winner ---
        method_raw = parse_method(cols[7])
        is_nc = method_raw == "NC" if method_raw else False
        is_draw = "DEC" == method_raw and "b-flag_style_bordered" in flag_class

        if first_fighter_won and not is_nc:
            winner = fighter_a
            result_type = "finish" if method_raw in ("KO/TKO", "SUB") else "decision"
            if method_raw == "DQ":
                result_type = "dq"
        else:
            winner = None
            result_type = "nc" if is_nc else "draw"

        # --- Weight class (col 6) ---
        wc_col = cols[6]
        weight_class = wc_col.find("p").get_text(strip=True) if wc_col.find("p") else wc_col.get_text(strip=True)
        # Clean up stray whitespace from embedded <br>/<img>
        weight_class = re.sub(r"\s+", " ", weight_class).strip()

        # --- Title fight: belt.png image in weight class col ---
        title_fight = bool(wc_col.find("img", src=lambda s: s and "belt.png" in s))

        # --- Method, round, time ---
        method = method_raw
        round_p = cols[8].find("p")
        rnd = None
        if round_p:
            try:
                rnd = int(round_p.get_text(strip=True))
            except ValueError:
                pass

        time_p = cols[9].find("p")
        fight_time = time_p.get_text(strip=True) if time_p else None

        fight_id = make_fight_id(event_id, fighter_a, fighter_b)

        fights.append({
            "fight_id": fight_id,
            "fighter_a": fighter_a,
            "fighter_b": fighter_b,
            "winner": winner,
            "method": method,
            "round": rnd,
            "time": fight_time,
            "card_position": None,  # filled below
            "card_type": None,      # filled below
            "weight_class": weight_class,
            "title_fight": title_fight,
            "result_type": result_type,
            "_section": current_section,
        })

    assign_card_positions_from_sections(fights)
    return fights


def scrape_events_list() -> list[dict]:
    """Return all completed events within the last 10 years."""
    print("Fetching events list from ufcstats.com...")
    soup = fetch(EVENTS_URL)

    cutoff = date.today() - timedelta(days=10 * 365)  # 10-year window
    events = []

    rows = soup.find_all("tr", class_="b-statistics__table-row")
    for row in rows:
        link = row.find("a", href=re.compile(r"event-details"))
        if not link:
            continue

        name = link.get_text(strip=True)
        url = link["href"]

        # Date is in a span inside the same td
        date_span = row.find("span", class_="b-statistics__date")
        if not date_span:
            continue
        date_text = date_span.get_text(strip=True)

        try:
            event_date = datetime.strptime(date_text, "%B %d, %Y").date()
        except ValueError:
            try:
                event_date = datetime.strptime(date_text, "%b. %d, %Y").date()
            except ValueError:
                continue

        if event_date < cutoff:
            continue
        # Skip future events
        if event_date > date.today():
            continue

        # Location is td[1] of the same row
        tds = row.find_all("td")
        location = tds[1].get_text(strip=True) if len(tds) > 1 else None

        events.append({
            "name": name,
            "date": event_date.isoformat(),
            "location": location,
            "url": url,
            "event_id": make_event_id(name),
        })

    return events


def run():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing data to determine what's already scraped
    existing_events: list[dict] = []
    if OUTPUT_FILE.exists():
        existing_events = json.loads(OUTPUT_FILE.read_text())
    already_scraped = {e["event_id"] for e in existing_events}

    events_meta = scrape_events_list()
    new_meta = [m for m in events_meta if m["event_id"] not in already_scraped]

    print(
        f"Found {len(already_scraped)} existing events, "
        f"scraping {len(new_meta)} new ones\n"
    )

    if not new_meta:
        print("Nothing to do — all events already scraped.")
        return 0

    new_events = []
    new_fights = 0
    errors = []

    for i, meta in enumerate(new_meta, 1):
        name = meta["name"]
        print(f"[{i}/{len(new_meta)}] Scraping {name}...", end=" ", flush=True)
        try:
            fights = parse_event_page(meta["url"], meta["event_id"])
            new_fights += len(fights)
            print(f"{len(fights)} fights found")

            new_events.append({
                "event_id": meta["event_id"],
                "name": name,
                "date": meta["date"],
                "location": meta.get("location"),
                "url": meta["url"],
                "fights": fights,
            })
        except Exception as e:
            print(f"ERROR: {e}")
            errors.append({"event": name, "url": meta["url"], "error": str(e)})

        if i < len(new_meta):
            time.sleep(1)

    # Merge and sort newest first
    all_events = existing_events + new_events
    all_events.sort(key=lambda e: e["date"], reverse=True)

    OUTPUT_FILE.write_text(json.dumps(all_events, indent=2, ensure_ascii=False))
    print(f"\nWrote {OUTPUT_FILE}")

    total_fights = sum(len(e["fights"]) for e in all_events)
    print("\n=== Summary ===")
    print(f"Previously scraped:  {len(already_scraped)} events")
    print(f"Newly scraped:       {len(new_events)} events ({new_fights} fights)")
    print(f"Total events:        {len(all_events)}")
    print(f"Total fights:        {total_fights}")
    if all_events:
        dates = [e["date"] for e in all_events]
        print(f"Date range:          {min(dates)} to {max(dates)}")
    if errors:
        print(f"\nErrors ({len(errors)}):")
        for e in errors:
            print(f"  {e['event']}: {e['error']}")
    else:
        print("No errors.")

    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(run())
