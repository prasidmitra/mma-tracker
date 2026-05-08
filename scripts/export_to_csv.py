#!/usr/bin/env python3
"""
Export predictions data to human-readable CSVs for manual verification.

Outputs:
  data/exports/predictions_all.csv  — one row per prediction
  data/exports/accuracy_summary.csv — one row per creator
  data/exports/flagged.csv          — all flagged/ambiguous predictions
"""

import csv
import json
import os
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
EXPORT_DIR = DATA_DIR / "exports"


def load_events() -> tuple[dict, dict]:
    """Returns (fight_map, event_map) keyed by fight_id and event_id."""
    events = json.loads((DATA_DIR / "events.json").read_text())
    fight_map = {}
    event_map = {}
    for ev in events:
        event_map[ev["event_id"]] = ev
        for f in ev["fights"]:
            fight_map[f["fight_id"]] = (ev, f)
    return fight_map, event_map


def load_all_predictions() -> list[dict]:
    preds_dir = DATA_DIR / "predictions"
    all_preds = []
    for path in sorted(preds_dir.glob("*.json")):
        all_preds.extend(json.loads(path.read_text()))
    return all_preds


def event_type(event_id: str) -> str:
    parts = event_id.split("-")
    if parts[-1].isdigit() and len(parts[-1]) >= 3:
        return "PPV"
    return "Fight Night"


def export_predictions_all(predictions: list[dict], fight_map: dict) -> int:
    cols = [
        "creator", "event_name", "event_date", "event_type",
        "fighter_a", "fighter_b", "predicted_winner", "confidence",
        "correct", "prediction_changed", "fight_skipped",
        "card_position", "card_type", "weight_class", "title_fight",
        "actual_winner", "method", "round", "video_id",
    ]
    out_path = EXPORT_DIR / "predictions_all.csv"
    rows_written = 0
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=cols)
        writer.writeheader()
        for p in predictions:
            fid = p.get("fight_id", "")
            if fid not in fight_map:
                continue
            ev, fight = fight_map[fid]
            writer.writerow({
                "creator": p["creator"],
                "event_name": ev["name"],
                "event_date": ev["date"],
                "event_type": event_type(ev["event_id"]),
                "fighter_a": fight["fighter_a"],
                "fighter_b": fight["fighter_b"],
                "predicted_winner": p.get("predicted_winner") or "",
                "confidence": p.get("confidence") or "",
                "correct": p.get("correct"),
                "prediction_changed": p.get("prediction_changed", False),
                "fight_skipped": p.get("fight_skipped", False),
                "card_position": fight.get("card_position") or "",
                "card_type": fight.get("card_type") or "",
                "weight_class": fight.get("weight_class") or "",
                "title_fight": fight.get("title_fight", False),
                "actual_winner": fight.get("winner") or "",
                "method": fight.get("method") or "",
                "round": fight.get("round") or "",
                "video_id": p.get("video_id") or "",
            })
            rows_written += 1
    return rows_written


def export_accuracy_summary(predictions: list[dict], fight_map: dict) -> int:
    flagged_raw = json.loads((DATA_DIR / "flagged.json").read_text())

    # Group flagged counts by creator
    flagged_by_creator: dict[str, int] = {}
    for fl in flagged_raw:
        c = fl["creator"]
        flagged_by_creator[c] = flagged_by_creator.get(c, 0) + 1

    # Group predictions by creator
    by_creator: dict[str, list] = {}
    for p in predictions:
        by_creator.setdefault(p["creator"], []).append(p)

    cols = [
        "creator", "total_predictions", "correct", "incorrect",
        "pick_ems", "skipped", "flagged", "excluded", "accuracy_pct",
        "main_event_accuracy_pct", "ppv_accuracy_pct", "fight_night_accuracy_pct",
    ]
    out_path = EXPORT_DIR / "accuracy_summary.csv"

    def accuracy_for(preds_subset):
        eligible = [p for p in preds_subset if p.get("correct") is not None]
        correct = sum(1 for p in eligible if p["correct"])
        return f"{correct / len(eligible) * 100:.1f}" if eligible else ""

    rows_written = 0
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=cols)
        writer.writeheader()
        for creator, preds in sorted(by_creator.items()):
            total = len(preds)
            correct_n = sum(1 for p in preds if p.get("correct") is True)
            incorrect_n = sum(1 for p in preds if p.get("correct") is False)
            pick_ems = sum(1 for p in preds if p.get("confidence") == "pick_em")
            skipped = sum(1 for p in preds if p.get("fight_skipped"))
            excluded = sum(1 for p in preds if p.get("correct") is None)
            flagged = flagged_by_creator.get(creator, 0)

            # Subset filters requiring fight_map lookup
            main_event_preds = []
            ppv_preds = []
            fn_preds = []
            for p in preds:
                fid = p.get("fight_id", "")
                if fid not in fight_map:
                    continue
                ev, fight = fight_map[fid]
                if fight.get("card_position") == "main_event":
                    main_event_preds.append(p)
                et = event_type(ev["event_id"])
                if et == "PPV":
                    ppv_preds.append(p)
                else:
                    fn_preds.append(p)

            eligible = [p for p in preds if p.get("correct") is not None]
            acc = f"{correct_n / len(eligible) * 100:.1f}" if eligible else ""

            writer.writerow({
                "creator": creator,
                "total_predictions": total,
                "correct": correct_n,
                "incorrect": incorrect_n,
                "pick_ems": pick_ems,
                "skipped": skipped,
                "flagged": flagged,
                "excluded": excluded,
                "accuracy_pct": acc,
                "main_event_accuracy_pct": accuracy_for(main_event_preds),
                "ppv_accuracy_pct": accuracy_for(ppv_preds),
                "fight_night_accuracy_pct": accuracy_for(fn_preds),
            })
            rows_written += 1
    return rows_written


def export_flagged(fight_map: dict, event_map: dict) -> int:
    flagged_raw = json.loads((DATA_DIR / "flagged.json").read_text())
    cols = [
        "flag_id", "creator", "event_name", "fight",
        "ambiguity_reason", "raw_excerpt", "suggested_winner",
        "confidence_in_suggestion", "manually_resolved", "resolved_winner",
    ]
    out_path = EXPORT_DIR / "flagged.csv"
    rows_written = 0
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=cols)
        writer.writeheader()
        for fl in flagged_raw:
            fid = fl.get("fight_id", "")
            eid = fl.get("event_id", "")
            event_name = event_map.get(eid, {}).get("name", eid)
            if fid in fight_map:
                _, fight = fight_map[fid]
                fight_label = f"{fight['fighter_a']} vs {fight['fighter_b']}"
            else:
                fight_label = fid
            writer.writerow({
                "flag_id": fl["flag_id"],
                "creator": fl["creator"],
                "event_name": event_name,
                "fight": fight_label,
                "ambiguity_reason": fl.get("ambiguity_reason") or "",
                "raw_excerpt": fl.get("raw_excerpt") or "",
                "suggested_winner": fl.get("suggested_winner") or "",
                "confidence_in_suggestion": fl.get("confidence_in_suggestion") or "",
                "manually_resolved": fl.get("manually_resolved", False),
                "resolved_winner": fl.get("resolved_winner") or "",
            })
            rows_written += 1
    return rows_written


def main():
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    fight_map, event_map = load_events()
    predictions = load_all_predictions()

    n_preds = export_predictions_all(predictions, fight_map)
    print(f"Exported {n_preds} predictions to data/exports/predictions_all.csv")

    n_summary = export_accuracy_summary(predictions, fight_map)
    print(f"Exported {n_summary} rows to data/exports/accuracy_summary.csv")

    n_flagged = export_flagged(fight_map, event_map)
    print(f"Exported {n_flagged} flagged items to data/exports/flagged.csv")


if __name__ == "__main__":
    main()
