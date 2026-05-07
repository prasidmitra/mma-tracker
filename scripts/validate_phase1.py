#!/usr/bin/env python3
"""Validate data/events.json and data/fighters.json for Phase 1 completeness."""

import json
import sys
from pathlib import Path
from collections import Counter

DATA_DIR = Path(__file__).parent.parent / "data"
EVENTS_FILE = DATA_DIR / "events.json"
FIGHTERS_FILE = DATA_DIR / "fighters.json"


def validate():
    errors = []
    warnings = []

    # --- events.json ---
    if not EVENTS_FILE.exists():
        print(f"FATAL: {EVENTS_FILE} not found")
        return 1

    events = json.loads(EVENTS_FILE.read_text())
    print(f"Loaded {len(events)} events from events.json")

    all_fights = []
    for event in events:
        for fight in event.get("fights", []):
            fight["_event_name"] = event["name"]
            fight["_event_date"] = event["date"]
            all_fights.append(fight)

    total_fights = len(all_fights)
    dates = sorted(e["date"] for e in events)
    earliest = dates[0] if dates else "N/A"
    latest = dates[-1] if dates else "N/A"

    # Unique fighters
    all_fighter_names = set()
    for f in all_fights:
        all_fighter_names.add(f["fighter_a"])
        all_fighter_names.add(f["fighter_b"])

    # Duplicate fight_ids
    fight_id_counts = Counter(f["fight_id"] for f in all_fights)
    dupes = {fid: cnt for fid, cnt in fight_id_counts.items() if cnt > 1}

    # Null winners (NC/Draw/DQ)
    null_winner_fights = [f for f in all_fights if f.get("winner") is None]

    # Events with fewer than 6 fights
    short_events = [
        (e["name"], e["date"], len(e.get("fights", [])))
        for e in events
        if len(e.get("fights", [])) < 6
    ]

    # Fights missing required fields
    required_fields = ["fight_id", "fighter_a", "fighter_b", "method", "card_type", "card_position"]
    missing_fields = []
    for f in all_fights:
        for field in required_fields:
            if field not in f or f[field] is None:
                missing_fields.append((f.get("fight_id", "UNKNOWN"), field))

    # --- fighters.json ---
    if not FIGHTERS_FILE.exists():
        print(f"FATAL: {FIGHTERS_FILE} not found")
        return 1

    fighters = json.loads(FIGHTERS_FILE.read_text())
    total_fighters = len(fighters)
    total_aliases = sum(len(v) for v in fighters.values())

    # Check all event fighters are in the alias table
    missing_from_alias = all_fighter_names - set(fighters.keys())

    # --- Report ---
    print()
    print("=" * 60)
    print("PHASE 1 VALIDATION REPORT")
    print("=" * 60)
    print(f"  Total events:          {len(events)}")
    print(f"  Date range:            {earliest} to {latest}")
    print(f"  Total fights:          {total_fights}")
    print(f"  Total unique fighters: {len(all_fighter_names)}")
    print(f"  Total alias entries:   {total_aliases}")
    print(f"  Fighters in alias DB:  {total_fighters}")
    print()

    if null_winner_fights:
        print(f"Fights with null winners (NC/Draw/DQ) — {len(null_winner_fights)} total:")
        for f in null_winner_fights[:20]:
            result = f.get("result_type", "?")
            print(f"    [{result}] {f['_event_name']} | {f['fight_id']}")
        if len(null_winner_fights) > 20:
            print(f"    ... and {len(null_winner_fights) - 20} more")
        print()

    if dupes:
        print(f"ERROR: Duplicate fight_ids found ({len(dupes)}):")
        for fid, cnt in dupes.items():
            print(f"  {fid} (appears {cnt} times)")
        errors.append(f"{len(dupes)} duplicate fight_id(s)")
        print()

    if short_events:
        print(f"WARNING: Events with fewer than 6 fights ({len(short_events)}):")
        for name, d, cnt in short_events:
            print(f"  {name} ({d}): {cnt} fights")
        warnings.append(f"{len(short_events)} events with <6 fights")
        print()

    if missing_fields:
        print(f"ERROR: Fights with missing required fields ({len(missing_fields)}):")
        for fid, field in missing_fields[:10]:
            print(f"  {fid}: missing {field}")
        errors.append(f"{len(missing_fields)} fights with missing fields")
        print()

    if missing_from_alias:
        print(f"WARNING: Fighters in events not in alias DB ({len(missing_from_alias)}):")
        for name in sorted(missing_from_alias)[:10]:
            print(f"  {name}")
        warnings.append(f"{len(missing_from_alias)} fighters missing from alias DB")
        print()

    print("=" * 60)
    if errors:
        print(f"RESULT: FAILED — {len(errors)} error(s)")
        for e in errors:
            print(f"  ERROR: {e}")
        for w in warnings:
            print(f"  WARNING: {w}")
        return 1
    else:
        print("RESULT: PASSED")
        if warnings:
            for w in warnings:
                print(f"  WARNING: {w}")
        return 0


if __name__ == "__main__":
    sys.exit(validate())
