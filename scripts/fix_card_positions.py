#!/usr/bin/env python3
"""
Re-scrape card positions for all events in events.json using section-aware parsing.

Only card_position and card_type are overwritten; all other fight data is preserved.
"""

import json
import re
import sys
import time
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

_SECTION_KEYWORDS = {
    "main card": "main_card",
    "preliminary card": "prelim",
    "early preliminary": "early_prelim",
}


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
            print(f"  Retry {attempt + 1}/{retries} (error: {e}), waiting {wait}s")
            time.sleep(wait)


def make_event_id(name: str) -> str:
    name = name.strip()
    m = re.match(r"UFC\s+(\d+)\b", name, re.I)
    if m:
        return f"ufc-{m.group(1)}"
    name = re.sub(r":\s+", " ", name)
    text = name.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def fetch_event_urls() -> dict[str, str]:
    """Return {event_id: url} for all completed events."""
    print("Fetching events list from UFCStats...")
    soup = fetch(EVENTS_URL)
    mapping: dict[str, str] = {}
    rows = soup.find_all("tr", class_="b-statistics__table-row")
    for row in rows:
        link = row.find("a", href=re.compile(r"event-details"))
        if not link:
            continue
        name = link.get_text(strip=True)
        url = link["href"]
        event_id = make_event_id(name)
        mapping[event_id] = url
    print(f"  Found {len(mapping)} event URLs")
    return mapping


def scrape_card_positions(event_url: str) -> dict[str, tuple[str, str]]:
    """
    Return {fight_id_key: (card_position, card_type)} where fight_id_key is
    'LAST_A-LAST_B' (alphabetically sorted lowercased last names).

    Returns empty dict if the page can't be parsed.
    """
    soup = fetch(event_url)

    fight_table = soup.find("table", class_=re.compile(r"b-fight-details__table"))
    if fight_table:
        all_rows = fight_table.find_all("tr")
    else:
        all_rows = soup.find_all("tr", class_="b-fight-details__table-row__hover")

    current_section = "main_card"
    fights_in_section: dict[str, int] = {}
    result: dict[str, tuple[str, str]] = {}

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
        if len(cols) < 2:
            continue

        fighter_links = cols[1].find_all("a")
        if len(fighter_links) < 2:
            continue
        fighter_a = fighter_links[0].get_text(strip=True)
        fighter_b = fighter_links[1].get_text(strip=True)

        last_a = fighter_a.strip().split()[-1].lower()
        last_b = fighter_b.strip().split()[-1].lower()
        key = "-".join(sorted([last_a, last_b]))

        idx = fights_in_section.get(current_section, 0)
        fights_in_section[current_section] = idx + 1

        if current_section == "main_card":
            card_type = "main_card"
            card_position = "main_event" if idx == 0 else "co_main" if idx == 1 else "main_card"
        elif current_section == "prelim":
            card_type = "prelim"
            card_position = "prelim"
        else:
            card_type = "early_prelim"
            card_position = "early_prelim"

        result[key] = (card_position, card_type)

    has_sections = current_section != "main_card" or any(
        s != "main_card" for s in fights_in_section
    )
    if not has_sections and result:
        # No sections detected — apply index heuristic
        items = list(result.items())
        n = len(items)
        new_result: dict[str, tuple[str, str]] = {}
        for i, (key, _) in enumerate(items):
            if n <= 5 or i < 5:
                ct = "main_card"
                cp = "main_event" if i == 0 else "co_main" if i == 1 else "main_card"
            elif i < 9:
                ct, cp = "prelim", "prelim"
            else:
                ct, cp = "early_prelim", "early_prelim"
            # Edge: <= 5 total fights → all main card
            if n <= 5:
                ct = "main_card"
                cp = "main_event" if i == 0 else "co_main" if i == 1 else "main_card"
            new_result[key] = (cp, ct)
        return new_result

    return result


def run() -> int:
    events: list[dict] = json.loads(OUTPUT_FILE.read_text())
    url_map = fetch_event_urls()

    total_events = 0
    total_fights_changed = 0
    errors: list[str] = []
    used_sections: int = 0
    used_heuristic: int = 0

    for i, event in enumerate(events, 1):
        event_id = event["event_id"]
        name = event["name"]
        url = url_map.get(event_id)
        if not url:
            print(f"[{i}/{len(events)}] {name} — no URL found, skipping")
            continue

        print(f"[{i}/{len(events)}] {name}...", end=" ", flush=True)
        try:
            positions = scrape_card_positions(url)
        except Exception as e:
            print(f"ERROR: {e}")
            errors.append(f"{name}: {e}")
            if i < len(events):
                time.sleep(1.5)
            continue

        if not positions:
            print("no fight data")
            if i < len(events):
                time.sleep(1.5)
            continue

        # Check whether sections were actually detected
        sections_found = any(
            v[0] not in ("main_event", "co_main", "main_card")
            for v in positions.values()
        ) or len(set(v[1] for v in positions.values())) > 1

        changed = 0
        mismatches = 0
        for fight in event["fights"]:
            last_a = fight["fighter_a"].strip().split()[-1].lower()
            last_b = fight["fighter_b"].strip().split()[-1].lower()
            key = "-".join(sorted([last_a, last_b]))
            if key not in positions:
                mismatches += 1
                continue
            new_cp, new_ct = positions[key]
            if fight.get("card_position") != new_cp or fight.get("card_type") != new_ct:
                fight["card_position"] = new_cp
                fight["card_type"] = new_ct
                changed += 1

        total_events += 1
        total_fights_changed += changed

        if sections_found:
            used_sections += 1
            tag = "[sections]"
        else:
            used_heuristic += 1
            tag = "[heuristic]"

        status = f"{changed} fights updated"
        if mismatches:
            status += f", {mismatches} unmatched"
        print(f"{tag} {status}")

        if i < len(events):
            time.sleep(1.5)

    OUTPUT_FILE.write_text(json.dumps(events, indent=2, ensure_ascii=False))
    print(f"\nWrote {OUTPUT_FILE}")
    print(f"\n=== Summary ===")
    print(f"Events processed:   {total_events}")
    print(f"  Section-based:    {used_sections}")
    print(f"  Heuristic:        {used_heuristic}")
    print(f"Fights updated:     {total_fights_changed}")
    if errors:
        print(f"\nErrors ({len(errors)}):")
        for e in errors:
            print(f"  {e}")
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(run())
