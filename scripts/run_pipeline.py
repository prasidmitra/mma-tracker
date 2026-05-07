#!/usr/bin/env python3
"""
Task 2D: Pipeline runner — chains 2A (discover) → 2B (transcripts) → 2C (parse).

Usage:
  python scripts/run_pipeline.py --creator mma_guru --year 2024
  python scripts/run_pipeline.py --creator all --year all
  python scripts/run_pipeline.py --event ufc-300 --creator all
  python scripts/run_pipeline.py --creator mma_guru --dry-run
  python scripts/run_pipeline.py --creator all --skip-existing
"""

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

import anthropic

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
MANIFEST_FILE = DATA_DIR / "video_manifest.json"
EVENTS_FILE = DATA_DIR / "events.json"
FIGHTERS_FILE = DATA_DIR / "fighters.json"

import sys
sys.path.insert(0, str(ROOT / "scripts"))

from discover_videos import run as discover_run, CREATORS
from fetch_transcripts import fetch_with_retry, TranscriptUnavailable, TranscriptRateLimited
from parse_predictions import (
    parse_video,
    load_predictions, save_predictions,
    load_flagged, save_flagged,
)


# ── Manifest helpers ─────────────────────────────────────────────────────────

def load_manifest() -> list[dict]:
    if MANIFEST_FILE.exists():
        return json.loads(MANIFEST_FILE.read_text())
    return []


def save_manifest(manifest: list[dict]) -> None:
    MANIFEST_FILE.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))


def update_manifest_entry(manifest: list[dict], video_id: str, creator: str, updates: dict) -> None:
    for entry in manifest:
        if entry["video_id"] == video_id and entry["creator"] == creator:
            entry.update(updates)
            return


# ── Filtering ────────────────────────────────────────────────────────────────

def filter_manifest(
    manifest: list[dict],
    creator_slugs: list[str] | None,
    year: int | None,
    event_id: str | None,
    skip_existing: bool,
    events_by_id: dict,
) -> list[dict]:
    entries = []
    for entry in manifest:
        if skip_existing and entry["status"] == "completed":
            continue
        if entry["status"] == "completed":
            continue  # Always skip completed in normal mode
        if entry["status"] == "transcript_unavailable":
            continue
        if creator_slugs and entry["creator"] not in creator_slugs:
            continue
        if event_id and entry["event_id"] != event_id:
            continue
        if year:
            ev = events_by_id.get(entry["event_id"])
            if not ev or not ev["date"].startswith(str(year)):
                continue
        entries.append(entry)
    return entries


# ── Main pipeline ────────────────────────────────────────────────────────────

def run(
    creator_slugs: list[str] | None = None,
    year: int | None = None,
    event_id_filter: str | None = None,
    skip_existing: bool = False,
    dry_run: bool = False,
    no_discover: bool = False,
) -> None:
    events_raw = json.loads(EVENTS_FILE.read_text())
    events_by_id = {e["event_id"]: e for e in events_raw}
    all_aliases = json.loads(FIGHTERS_FILE.read_text())

    # ── 2A: Discovery ────────────────────────────────────────────────────────
    if not no_discover:
        print("=" * 60)
        print("STEP 1: Video Discovery")
        print("=" * 60)
        # In dry-run: discover returns new entries without writing them
        discovered = discover_run(creator_slugs=creator_slugs, dry_run=dry_run)
    else:
        discovered = []

    if dry_run:
        # Filter discovered entries the same way processing would
        candidate_pool = discovered if discovered else load_manifest()
        pending_dry = [
            e for e in candidate_pool
            if (not creator_slugs or e["creator"] in creator_slugs)
            and (not year or events_by_id.get(e["event_id"], {}).get("date", "").startswith(str(year)))
            and (not event_id_filter or e["event_id"] == event_id_filter)
        ]
        print(f"\n[DRY RUN] {len(pending_dry)} videos would be processed:")
        for e in pending_dry[:30]:
            print(f"  [{e['creator']}] {e['event_id']} ({e['published_at']}) — {e['title'][:55]}")
        if len(pending_dry) > 30:
            print(f"  ... and {len(pending_dry) - 30} more")
        return

    # ── 2B + 2C: Fetch transcripts + parse predictions ────────────────────────
    print("\n" + "=" * 60)
    print("STEP 2: Transcript + Prediction Parsing")
    print("=" * 60)

    manifest = load_manifest()
    pending = filter_manifest(
        manifest, creator_slugs, year, event_id_filter, skip_existing, events_by_id
    )
    print(f"\n{len(pending)} videos to process\n")

    client = anthropic.Anthropic()

    # Per-creator prediction caches (load once, append, save at end)
    pred_cache: dict[str, list] = {}
    flagged = load_flagged()

    # Existing prediction_ids per creator (for deduplication)
    existing_pred_ids: dict[str, set] = {}

    total_processed = 0
    total_predictions = 0
    total_flags = 0
    total_cost = 0.0

    for i, entry in enumerate(pending, 1):
        creator = entry["creator"]
        video_id = entry["video_id"]
        eid = entry["event_id"]
        title = entry["title"]

        print(f"[{i}/{len(pending)}] {creator} | {eid} | {title[:50]}")

        # Load creator predictions if not cached
        if creator not in pred_cache:
            pred_cache[creator] = load_predictions(creator)
            existing_pred_ids[creator] = {p["prediction_id"] for p in pred_cache[creator]}

        event = events_by_id.get(eid)
        if not event:
            print(f"  WARN: event_id {eid} not found in events.json — skipping")
            continue

        # ── 2B: Fetch transcript ─────────────────────────────────────────────
        try:
            transcript, t_type = fetch_with_retry(video_id)
            word_count = len(transcript.split())
            print(f"  Transcript: {t_type}, {word_count} words")
            update_manifest_entry(manifest, video_id, creator, {
                "status": "transcript_fetched",
                "transcript_type": t_type,
            })
        except TranscriptRateLimited as e:
            print(f"  Rate limited: {e}")
            print("  Stopping pipeline — re-run when rate limit clears (a few hours).")
            save_manifest(manifest)
            return  # Stop processing; all remaining stay 'pending' for next run
        except TranscriptUnavailable as e:
            print(f"  No transcript: {e}")
            update_manifest_entry(manifest, video_id, creator, {
                "status": "transcript_unavailable",
                "transcript_type": None,
            })
            save_manifest(manifest)
            continue
        except Exception as e:
            print(f"  Transcript error: {e}")
            continue

        time.sleep(3)

        # ── 2C: Parse predictions ────────────────────────────────────────────
        try:
            predictions, new_flags, usage = parse_video(
                client=client,
                creator=creator,
                video_id=video_id,
                event=event,
                transcript=transcript,
                transcript_type=t_type,
                all_aliases=all_aliases,
                existing_flag_count=len(flagged),
            )
        except Exception as e:
            print(f"  Parse error: {e}")
            update_manifest_entry(manifest, video_id, creator, {"status": "failed"})
            save_manifest(manifest)
            continue

        # Deduplicate predictions
        new_preds = [p for p in predictions if p["prediction_id"] not in existing_pred_ids[creator]]
        for p in new_preds:
            existing_pred_ids[creator].add(p["prediction_id"])

        pred_cache[creator].extend(new_preds)
        flagged.extend(new_flags)

        skipped = sum(1 for p in new_preds if p.get("fight_skipped"))
        cost = usage["estimated_cost_usd"]
        total_cost += cost

        print(
            f"  Parsed: {len(new_preds)} predictions, "
            f"{len(new_flags)} flags, "
            f"{skipped} skipped | ${cost:.4f}"
        )
        print(
            f"  Tokens: haiku_in={usage['haiku_input']} "
            f"haiku_out={usage['haiku_output']} "
            f"sonnet_in={usage['sonnet_input']} "
            f"sonnet_out={usage['sonnet_output']}"
        )

        update_manifest_entry(manifest, video_id, creator, {
            "status": "completed",
            "predictions_extracted": len(new_preds),
            "flagged_count": len(new_flags),
            "skipped_count": skipped,
            "processed_at": datetime.now(timezone.utc).isoformat(),
        })

        total_processed += 1
        total_predictions += len(new_preds)
        total_flags += len(new_flags)

        # Save after each video so progress is never lost
        save_manifest(manifest)
        save_predictions(creator, pred_cache[creator])
        save_flagged(flagged)

    # ── Summary ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)
    print(f"  Videos processed:       {total_processed}")
    print(f"  Predictions extracted:  {total_predictions}")
    print(f"  Flags added:            {total_flags}")
    print(f"  Estimated API cost:     ${total_cost:.4f}")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="MMA Tracker prediction pipeline")
    parser.add_argument("--creator", default="all", help="Creator slug or 'all'")
    parser.add_argument("--year", default=None, type=int, help="Filter to a specific year")
    parser.add_argument("--event", default=None, help="Specific event_id (e.g. ufc-300)")
    parser.add_argument("--skip-existing", action="store_true", help="Skip completed videos")
    parser.add_argument("--dry-run", action="store_true", help="Discover only, no parsing")
    parser.add_argument("--no-discover", action="store_true", help="Skip discovery step")
    args = parser.parse_args()

    slugs = None if args.creator == "all" else [args.creator]

    run(
        creator_slugs=slugs,
        year=args.year,
        event_id_filter=args.event,
        skip_existing=args.skip_existing,
        dry_run=args.dry_run,
        no_discover=args.no_discover,
    )


if __name__ == "__main__":
    main()
