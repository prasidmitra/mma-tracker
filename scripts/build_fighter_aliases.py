#!/usr/bin/env python3
"""Build data/fighters.json from events.json plus hardcoded nickname table."""

import json
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
EVENTS_FILE = DATA_DIR / "events.json"
OUTPUT_FILE = DATA_DIR / "fighters.json"

KNOWN_NICKNAMES: dict[str, list[str]] = {
    "Alex Pereira": ["Poatan"],
    "Dustin Poirier": ["Blessed"],
    "Justin Gaethje": ["The Highlight"],
    "Islam Makhachev": [],
    "Conor McGregor": ["The Notorious", "Conor"],
    "Jon Jones": ["Bones"],
    "Israel Adesanya": ["The Last Stylebender", "Izzy", "Stylebender"],
    "Sean O'Malley": ["Suga", "Sugar", "Suga Sean"],
    "Paddy Pimblett": ["The Baddy", "Paddy"],
    "Khamzat Chimaev": ["Borz"],
    "Belal Muhammad": ["Remember The Name", "Belal"],
    "Leon Edwards": ["Rocky"],
    "Nate Diaz": ["Nate"],
    "Nick Diaz": ["Nick"],
    "Max Holloway": ["Blessed"],
    "Charles Oliveira": ["Do Bronx"],
    "Michael Chandler": ["Iron"],
    "Tony Ferguson": ["El Cucuy"],
    "Colby Covington": ["Chaos"],
    "Jorge Masvidal": ["Gamebred"],
    "Gilbert Burns": ["Durinho"],
    "Kamaru Usman": ["The Nigerian Nightmare", "Usman"],
    "Robert Whittaker": ["The Reaper", "Bobby Knuckles"],
    "Marvin Vettori": ["The Italian Dream"],
    "Sean Strickland": ["Tarzan"],
    "Dricus Du Plessis": ["Stillknocks", "DDP"],
    "Tom Aspinall": ["Aspinall"],
    "Ciryl Gane": ["Bon Gamin"],
    "Sergei Pavlovich": ["Pavlovich"],
    "Curtis Blaydes": ["Razor"],
    "Derrick Lewis": ["The Black Beast"],
    "Stipe Miocic": ["Stipe"],
    "Francis Ngannou": ["The Predator", "Ngannou"],
    "Valentina Shevchenko": ["Bullet"],
    "Amanda Nunes": ["The Lioness"],
    "Zhang Weili": ["Magnum"],
    "Alexa Grasso": ["Grasso"],
    "Aljamain Sterling": ["Funk Master", "Aljo"],
    "Merab Dvalishvili": ["The Machine", "Merab"],
    "Henry Cejudo": ["Triple C"],
    "Jose Aldo": ["Junior"],
    "Yair Rodriguez": ["El Pantera"],
    "Brian Ortega": ["T-City"],
    "Alexander Volkanovski": ["The Great", "Volk"],
    "Zabit Magomedsharipov": ["Zabit"],
    "Dan Hooker": ["The Hangman", "Hooker"],
    "Calvin Kattar": ["The Boston Finisher"],
    "Arnold Allen": ["Almighty"],
    "Movsar Evloev": ["Immortal"],
}


def collect_canonical_names(events: list[dict]) -> set[str]:
    names = set()
    for event in events:
        for fight in event.get("fights", []):
            names.add(fight["fighter_a"])
            names.add(fight["fighter_b"])
    return names


def auto_aliases(canonical: str) -> list[str]:
    """Generate first name, last name aliases from a canonical name."""
    parts = canonical.strip().split()
    aliases = []
    if len(parts) >= 2:
        aliases.append(parts[-1])   # last name
        aliases.append(parts[0])    # first name
    return aliases


def build(canonical_names: set[str]) -> dict[str, list[str]]:
    fighters: dict[str, list[str]] = {}

    for name in sorted(canonical_names):
        aliases = []

        # Auto-generate first/last name aliases
        for a in auto_aliases(name):
            if a not in aliases:
                aliases.append(a)

        # Layer in hardcoded nicknames if this fighter is in the table
        for nickname in KNOWN_NICKNAMES.get(name, []):
            if nickname not in aliases:
                aliases.append(nickname)

        fighters[name] = aliases

    # Add any fighters from KNOWN_NICKNAMES that didn't appear in events
    # (they might be older fighters referenced in transcripts)
    for name, nicknames in KNOWN_NICKNAMES.items():
        if name not in fighters:
            aliases = []
            for a in auto_aliases(name):
                if a not in aliases:
                    aliases.append(a)
            for n in nicknames:
                if n not in aliases:
                    aliases.append(n)
            fighters[name] = aliases

    return fighters


def run():
    if not EVENTS_FILE.exists():
        print(f"ERROR: {EVENTS_FILE} not found. Run scrape_ufc_results.py first.")
        return 1

    events = json.loads(EVENTS_FILE.read_text())
    canonical_names = collect_canonical_names(events)

    print(f"Found {len(canonical_names)} unique fighters in events.json")

    fighters = build(canonical_names)

    OUTPUT_FILE.write_text(json.dumps(fighters, indent=2, ensure_ascii=False, sort_keys=True))
    print(f"Wrote {OUTPUT_FILE}")

    total_aliases = sum(len(v) for v in fighters.values())
    print(f"\n=== Summary ===")
    print(f"Total fighters: {len(fighters)}")
    print(f"Total alias entries: {total_aliases}")
    print(f"Fighters with known nicknames: {sum(1 for k in fighters if k in KNOWN_NICKNAMES and KNOWN_NICKNAMES[k])}")

    return 0


if __name__ == "__main__":
    sys.exit(run())
