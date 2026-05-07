#!/usr/bin/env python3
"""
Task 2E: Validate Phase 2 output — predictions, flags, manifest coverage.

Exits with code 1 if data integrity errors found.
"""

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
EVENTS_FILE = DATA_DIR / "events.json"
MANIFEST_FILE = DATA_DIR / "video_manifest.json"
PREDICTIONS_DIR = DATA_DIR / "predictions"
FLAGGED_FILE = DATA_DIR / "flagged.json"

CREATORS = [
    "mma_guru", "mma_joey", "sneaky_mma", "brendan_schaub",
    "luke_thomas", "the_weasel", "bedtime_mma", "lucas_tracy_mma",
]


def validate():
    errors = []
    warnings = []

    # ── Load data ─────────────────────────────────────────────────────────────
    events = json.loads(EVENTS_FILE.read_text()) if EVENTS_FILE.exists() else []
    manifest = json.loads(MANIFEST_FILE.read_text()) if MANIFEST_FILE.exists() else []
    flagged = json.loads(FLAGGED_FILE.read_text()) if FLAGGED_FILE.exists() else []

    all_fight_ids = {f["fight_id"] for e in events for f in e["fights"]}
    all_event_ids = {e["event_id"] for e in events}
    fights_by_id = {f["fight_id"]: f for e in events for f in e["fights"]}
    events_by_id = {e["event_id"]: e for e in events}

    print("=" * 65)
    print("PHASE 2 VALIDATION REPORT")
    print("=" * 65)

    # ── Manifest summary ──────────────────────────────────────────────────────
    manifest_by_creator: dict[str, list] = defaultdict(list)
    for entry in manifest:
        manifest_by_creator[entry["creator"]].append(entry)

    status_counts = Counter(e["status"] for e in manifest)
    print(f"\nManifest: {len(manifest)} total entries")
    for status, cnt in sorted(status_counts.items()):
        print(f"  {status}: {cnt}")

    # ── Per-creator report ────────────────────────────────────────────────────
    print("\n" + "-" * 65)
    print(f"{'Creator':<22} {'Videos':>7} {'Preds':>6} {'Flags':>6} {'Accuracy':>10} {'Coverage':>9}")
    print("-" * 65)

    global_total_preds = 0
    global_eligible = 0
    global_correct = 0
    global_flags = 0
    global_excluded = 0

    for creator in CREATORS:
        pred_file = PREDICTIONS_DIR / f"{creator}.json"
        predictions = json.loads(pred_file.read_text()) if pred_file.exists() else []
        creator_manifest = manifest_by_creator.get(creator, [])
        creator_flags = [f for f in flagged if f["creator"] == creator]

        completed = sum(1 for e in creator_manifest if e["status"] == "completed")

        # Coverage: how many events have a matched video
        matched_events = {e["event_id"] for e in creator_manifest}
        coverage_pct = 100 * len(matched_events) / len(events) if events else 0

        # Accuracy
        eligible = [
            p for p in predictions
            if p.get("correct") is not None
        ]
        correct_count = sum(1 for p in eligible if p["correct"])
        excluded_count = sum(1 for p in predictions if p.get("correct") is None)

        accuracy_str = (
            f"{correct_count}/{len(eligible)} ({100*correct_count/len(eligible):.1f}%)"
            if eligible else "N/A"
        )

        print(
            f"{creator:<22} {completed:>7} {len(predictions):>6} {len(creator_flags):>6} "
            f"{accuracy_str:>10} {coverage_pct:>8.1f}%"
        )

        global_total_preds += len(predictions)
        global_eligible += len(eligible)
        global_correct += correct_count
        global_flags += len(creator_flags)
        global_excluded += excluded_count

    print("-" * 65)

    # ── Global summary ────────────────────────────────────────────────────────
    print(f"\nGlobal summary:")
    print(f"  Total predictions:  {global_total_preds}")
    print(f"  Eligible:           {global_eligible}")
    print(f"  Excluded (null/skipped/flagged): {global_excluded}")
    print(f"  Total flags:        {global_flags}")
    if global_eligible:
        print(f"  Overall accuracy:   {global_correct}/{global_eligible} ({100*global_correct/global_eligible:.1f}%)")

    # ── Integrity checks ──────────────────────────────────────────────────────
    print(f"\n{'─'*65}")
    print("Integrity checks:")

    # 1. fight_ids in predictions that don't exist in events.json
    bad_fight_ids = []
    for creator in CREATORS:
        pred_file = PREDICTIONS_DIR / f"{creator}.json"
        if not pred_file.exists():
            continue
        for p in json.loads(pred_file.read_text()):
            if p["fight_id"] not in all_fight_ids:
                bad_fight_ids.append((creator, p["fight_id"]))

    if bad_fight_ids:
        errors.append(f"{len(bad_fight_ids)} predictions reference unknown fight_ids")
        print(f"  ERROR: {len(bad_fight_ids)} unknown fight_ids:")
        for creator, fid in bad_fight_ids[:5]:
            print(f"    {creator}: {fid}")

    # 2. Duplicate prediction_ids
    all_pred_ids = []
    for creator in CREATORS:
        pred_file = PREDICTIONS_DIR / f"{creator}.json"
        if pred_file.exists():
            all_pred_ids.extend(p["prediction_id"] for p in json.loads(pred_file.read_text()))
    dupe_ids = [pid for pid, cnt in Counter(all_pred_ids).items() if cnt > 1]
    if dupe_ids:
        errors.append(f"{len(dupe_ids)} duplicate prediction_ids")
        print(f"  ERROR: {len(dupe_ids)} duplicate prediction_ids:")
        for pid in dupe_ids[:5]:
            print(f"    {pid}")

    # 3. Manifest event_ids not in events.json
    bad_event_refs = [
        (e["creator"], e["event_id"])
        for e in manifest
        if e["event_id"] not in all_event_ids
    ]
    if bad_event_refs:
        warnings.append(f"{len(bad_event_refs)} manifest entries reference unknown event_ids")
        print(f"  WARN: {len(bad_event_refs)} manifest entries with unknown event_ids")

    # 4. Videos marked completed but no predictions saved
    for creator in CREATORS:
        pred_file = PREDICTIONS_DIR / f"{creator}.json"
        preds_for_creator = json.loads(pred_file.read_text()) if pred_file.exists() else []
        pred_video_ids = {p["video_id"] for p in preds_for_creator}
        for e in manifest_by_creator.get(creator, []):
            if e["status"] == "completed" and e["video_id"] not in pred_video_ids:
                warnings.append(f"{creator}/{e['video_id']} completed but no predictions found")

    if not bad_fight_ids and not dupe_ids and not bad_event_refs:
        print("  All checks passed.")

    # ── Result ────────────────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    if errors:
        print(f"RESULT: FAILED — {len(errors)} error(s)")
        for e in errors:
            print(f"  ERROR: {e}")
        for w in warnings[:5]:
            print(f"  WARN:  {w}")
        return 1
    else:
        print("RESULT: PASSED")
        for w in warnings[:5]:
            print(f"  WARN:  {w}")
        return 0


if __name__ == "__main__":
    sys.exit(validate())
