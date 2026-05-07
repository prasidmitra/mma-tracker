#!/usr/bin/env python3
"""
Task 2C: Parse UFC fight predictions from video transcripts using Claude.

Uses the exact prompt architecture defined in CLAUDE.md.
Pass 1: Claude Haiku (bulk, cheap)
Pass 2: Claude Sonnet for ambiguous predictions only
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

import anthropic

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"

# ── Models ───────────────────────────────────────────────────────────────────

MODEL_HAIKU = "claude-haiku-4-5-20251001"
MODEL_SONNET = "claude-sonnet-4-6"

# Approximate token costs (per token)
COST = {
    MODEL_HAIKU:  {"input": 1.00 / 1_000_000, "output": 5.00 / 1_000_000},
    MODEL_SONNET: {"input": 3.00 / 1_000_000, "output": 15.00 / 1_000_000},
}

MAX_TRANSCRIPT_WORDS = 12_000

# ── System prompt (verbatim from CLAUDE.md) ──────────────────────────────────

SYSTEM_PROMPT = """You are extracting UFC fight predictions from a YouTube video transcript.
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
explicitly skips it."""

RESPONSE_SCHEMA_EXAMPLE = """{
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
}"""


# ── Helpers ──────────────────────────────────────────────────────────────────

def truncate_transcript(text: str, max_words: int = MAX_TRANSCRIPT_WORDS) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]) + " [TRANSCRIPT TRUNCATED]"


def build_alias_subset(fights: list[dict], all_aliases: dict) -> dict:
    """Return only alias entries for fighters on this specific card."""
    fighters = set()
    for f in fights:
        fighters.add(f["fighter_a"])
        fighters.add(f["fighter_b"])
    return {name: aliases for name, aliases in all_aliases.items() if name in fighters}


def make_prediction_id(creator: str, fight_id: str) -> str:
    return f"{creator}_{fight_id.replace('-', '_')}"


def build_user_message(
    event: dict,
    fights: list[dict],
    alias_subset: dict,
    transcript: str,
    transcript_type: str,
) -> str:
    word_count = len(transcript.split())
    card_json = json.dumps(
        [
            {
                "fight_id": f["fight_id"],
                "fighter_a": f["fighter_a"],
                "fighter_b": f["fighter_b"],
                "weight_class": f.get("weight_class", ""),
                "title_fight": f.get("title_fight", False),
            }
            for f in fights
        ],
        indent=2,
    )
    alias_json = json.dumps(alias_subset, indent=2)

    return f"""FIGHT CARD: {event['name']} ({event['date']})
{card_json}

FIGHTER ALIASES (this card only):
{alias_json}

TRANSCRIPT ({transcript_type}, {word_count} words):
{transcript}

Return a JSON ARRAY with one object per fight on the card above.
Schema for each element:
{RESPONSE_SCHEMA_EXAMPLE}"""


def parse_claude_response(text: str) -> list[dict]:
    """Extract JSON array from Claude's response, handling markdown fences."""
    text = text.strip()
    # Strip markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def call_claude(client: anthropic.Anthropic, model: str, user_message: str) -> tuple[list[dict], dict]:
    """
    Call Claude with the system prompt and user message.
    Returns (parsed predictions list, usage dict).
    System prompt is cached for cost savings on repeated calls.
    """
    response = client.messages.create(
        model=model,
        max_tokens=4096,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_message}],
    )

    usage = {
        "model": model,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
        "cache_creation_input_tokens": getattr(response.usage, "cache_creation_input_tokens", 0),
        "cache_read_input_tokens": getattr(response.usage, "cache_read_input_tokens", 0),
    }

    raw = response.content[0].text
    try:
        predictions = parse_claude_response(raw)
    except (json.JSONDecodeError, ValueError) as e:
        raise ValueError(f"Claude returned invalid JSON: {e}\nRaw response:\n{raw[:500]}")

    return predictions, usage


def estimate_cost(usage: dict) -> float:
    model = usage["model"]
    c = COST.get(model, COST[MODEL_HAIKU])
    input_cost = usage["input_tokens"] * c["input"]
    output_cost = usage["output_tokens"] * c["output"]
    # Cache read tokens are ~10% of input cost
    cache_read_cost = usage.get("cache_read_input_tokens", 0) * c["input"] * 0.1
    return input_cost + output_cost + cache_read_cost


# ── Prediction processing ────────────────────────────────────────────────────

def process_raw_prediction(
    raw: dict,
    creator: str,
    event_id: str,
    video_id: str,
    fight_result: dict,
) -> dict:
    """Convert Claude's raw prediction output into the stored prediction schema."""
    fight_id = raw["fight_id"]
    predicted_winner = raw.get("predicted_winner")
    fight_winner = fight_result.get("winner")  # None for NC/draw

    # Determine correctness
    correct = None
    if (
        predicted_winner is not None
        and fight_winner is not None
        and not raw.get("ambiguous", False)
        and not raw.get("fight_skipped", False)
        and raw.get("confidence") not in ("pick_em", "not_found")
    ):
        correct = predicted_winner == fight_winner

    return {
        "prediction_id": make_prediction_id(creator, fight_id),
        "creator": creator,
        "event_id": event_id,
        "fight_id": fight_id,
        "video_id": video_id,
        "predicted_winner": predicted_winner,
        "confidence": raw.get("confidence"),
        "correct": correct,
        "prediction_changed": raw.get("prediction_changed", False),
        "fight_skipped": raw.get("fight_skipped", False),
        "raw_excerpt": raw.get("raw_excerpt"),
    }


def build_flagged_entry(
    raw: dict,
    creator: str,
    event_id: str,
    video_id: str,
    flag_index: int,
) -> dict:
    return {
        "flag_id": f"flag_{flag_index:04d}",
        "creator": creator,
        "event_id": event_id,
        "fight_id": raw["fight_id"],
        "video_id": video_id,
        "ambiguity_reason": raw.get("ambiguity_reason"),
        "raw_excerpt": raw.get("raw_excerpt"),
        "suggested_winner": raw.get("predicted_winner"),
        "confidence_in_suggestion": raw.get("confidence"),
        "status": "pending_review",
        "manually_resolved": False,
        "resolved_winner": None,
    }


# ── Main parse function ──────────────────────────────────────────────────────

def parse_video(
    client: anthropic.Anthropic,
    creator: str,
    video_id: str,
    event: dict,
    transcript: str,
    transcript_type: str,
    all_aliases: dict,
    existing_flag_count: int = 0,
) -> tuple[list[dict], list[dict], dict]:
    """
    Parse predictions for one video.

    Returns:
        (predictions, flagged_entries, total_usage)
    """
    fights = event["fights"]
    alias_subset = build_alias_subset(fights, all_aliases)
    fight_map = {f["fight_id"]: f for f in fights}

    transcript_trimmed = truncate_transcript(transcript)
    user_msg = build_user_message(event, fights, alias_subset, transcript_trimmed, transcript_type)

    # Pass 1: Haiku
    raw_predictions, usage_1 = call_claude(client, MODEL_HAIKU, user_msg)

    predictions: list[dict] = []
    flagged: list[dict] = []
    flag_idx = existing_flag_count

    # Collect ambiguous fight_ids for Pass 2
    ambiguous_fights = [r for r in raw_predictions if r.get("ambiguous")]

    # Pass 2: Sonnet re-run for ambiguous predictions
    sonnet_resolutions: dict[str, dict] = {}
    usage_2 = {"model": MODEL_SONNET, "input_tokens": 0, "output_tokens": 0,
                "cache_creation_input_tokens": 0, "cache_read_input_tokens": 0}

    if ambiguous_fights:
        # Build a focused message for just the ambiguous fights
        ambiguous_fight_cards = [
            f for f in fights if f["fight_id"] in {r["fight_id"] for r in ambiguous_fights}
        ]
        # Find relevant transcript section (rough: just send full trimmed transcript)
        focused_msg = (
            build_user_message(event, ambiguous_fight_cards, alias_subset, transcript_trimmed, transcript_type)
            + "\n\nNote: These specific fights were flagged as ambiguous in a first pass. "
            "Apply extra care to resolve the ambiguity if possible."
        )
        try:
            sonnet_raw, usage_2 = call_claude(client, MODEL_SONNET, focused_msg)
            for r in sonnet_raw:
                sonnet_resolutions[r["fight_id"]] = r
        except Exception as e:
            print(f"  Sonnet pass failed: {e} — keeping Haiku ambiguous flags", file=sys.stderr)

    # Process all predictions
    for raw in raw_predictions:
        fid = raw.get("fight_id")
        fight_result = fight_map.get(fid)
        if not fight_result:
            continue  # Claude hallucinated a fight not on the card

        # Use Sonnet resolution if available and less ambiguous
        if fid in sonnet_resolutions:
            resolved = sonnet_resolutions[fid]
            if not resolved.get("ambiguous", True):
                raw = resolved  # Use Sonnet's cleaner result

        if raw.get("ambiguous"):
            flag_idx += 1
            flagged.append(build_flagged_entry(raw, creator, event["event_id"], video_id, flag_idx))
        else:
            predictions.append(
                process_raw_prediction(raw, creator, event["event_id"], video_id, fight_result)
            )

    # Merge usage
    total_usage = {
        "haiku_input": usage_1["input_tokens"],
        "haiku_output": usage_1["output_tokens"],
        "haiku_cache_read": usage_1.get("cache_read_input_tokens", 0),
        "sonnet_input": usage_2["input_tokens"],
        "sonnet_output": usage_2["output_tokens"],
        "estimated_cost_usd": estimate_cost(usage_1) + estimate_cost(usage_2),
    }

    return predictions, flagged, total_usage


# ── File I/O helpers used by pipeline ────────────────────────────────────────

def load_predictions(creator: str) -> list[dict]:
    path = DATA_DIR / "predictions" / f"{creator}.json"
    if path.exists():
        return json.loads(path.read_text())
    return []


def save_predictions(creator: str, predictions: list[dict]) -> None:
    path = DATA_DIR / "predictions" / f"{creator}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(predictions, indent=2, ensure_ascii=False))


def load_flagged() -> list[dict]:
    path = DATA_DIR / "flagged.json"
    if path.exists():
        return json.loads(path.read_text())
    return []


def save_flagged(flagged: list[dict]) -> None:
    path = DATA_DIR / "flagged.json"
    path.write_text(json.dumps(flagged, indent=2, ensure_ascii=False))
