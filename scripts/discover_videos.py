#!/usr/bin/env python3
"""
Task 2A: Discover YouTube prediction videos for each creator and match to events.

Outputs data/video_manifest.json. Incremental — never overwrites completed entries.
Caches all YouTube API responses in tmp/youtube_cache/ to preserve quota.
"""

import json
import re
import sys
import time
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
import os

load_dotenv()

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
CACHE_DIR = ROOT / "tmp" / "youtube_cache"
CHANNELS_CACHE_FILE = DATA_DIR / "channels_cache.json"
MANIFEST_FILE = DATA_DIR / "video_manifest.json"
EVENTS_FILE = DATA_DIR / "events.json"

PREDICTION_KEYWORDS = ["prediction", "predictions", "picks", "preview", "breakdown"]
MAX_DAYS_BEFORE = 14
CUTOFF_DAYS = 10 * 365

CREATORS = {
    "mma_guru": {
        "channel_id": "UCIhQvpinmS8Eq6PrQ021DKQ",  # @the-mma-guru, 421k subs
        "display_name": "MMA Guru",
        "search_terms": ["UFC", "predictions", "preview", "breakdown"],
    },
    "mma_joey": {
        "channel_id": "UCHMz3GPVRmDmFOOLplZC0ZQ",  # @MMAJoey
        "display_name": "MMA Joey",
        "search_terms": ["UFC", "predictions", "picks"],
    },
    "sneaky_mma": {
        "channel_id": None,
        "display_name": "Sneaky MMA",
        "search_terms": ["UFC", "predictions"],
    },
    "brendan_schaub": {
        "channel_id": None,
        "display_name": "Brendan Schaub",
        "search_terms": ["UFC", "predictions", "picks", "preview"],
    },
    "luke_thomas": {
        "channel_id": None,
        "display_name": "Luke Thomas",
        "search_terms": ["UFC", "predictions", "picks"],
    },
    "the_weasel": {
        "channel_id": "UCZD2qRU8J82XGdGdUWYneNQ",  # @TheWeasle
        "display_name": "The Weasel",
        "search_terms": ["UFC", "predictions", "picks", "preview"],
    },
    "bedtime_mma": {
        "channel_id": None,
        "display_name": "Bedtime MMA",
        "search_terms": ["UFC", "predictions", "picks"],
    },
    "lucas_tracy_mma": {
        "channel_id": "UC7LzaJA-R2E52qzd5GW-kpg",  # @LucasTracyMMA
        "display_name": "Lucas Tracy MMA",
        "search_terms": ["UFC", "predictions", "picks", "breakdown"],
    },
}


# ── Cache helpers ────────────────────────────────────────────────────────────

def _cache_path(key: str) -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    return CACHE_DIR / f"{key}.json"


def cache_get(key: str):
    p = _cache_path(key)
    if p.exists():
        return json.loads(p.read_text())
    return None


def cache_set(key: str, data) -> None:
    _cache_path(key).write_text(json.dumps(data, ensure_ascii=False))


# ── Channels cache ───────────────────────────────────────────────────────────

def load_channels_cache() -> dict:
    if CHANNELS_CACHE_FILE.exists():
        return json.loads(CHANNELS_CACHE_FILE.read_text())
    return {}


def save_channels_cache(cache: dict) -> None:
    CHANNELS_CACHE_FILE.write_text(json.dumps(cache, indent=2))


# ── Video manifest ───────────────────────────────────────────────────────────

def load_manifest() -> list:
    if MANIFEST_FILE.exists():
        return json.loads(MANIFEST_FILE.read_text())
    return []


def save_manifest(manifest: list) -> None:
    MANIFEST_FILE.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))


# ── YouTube API helpers ──────────────────────────────────────────────────────

def build_youtube():
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        print("ERROR: YOUTUBE_API_KEY not set in .env", file=sys.stderr)
        sys.exit(1)
    return build("youtube", "v3", developerKey=api_key)


def yt_request_cached(cache_key: str, call_fn):
    """Execute a YouTube API call with caching."""
    cached = cache_get(cache_key)
    if cached is not None:
        return cached
    result = call_fn()
    cache_set(cache_key, result)
    return result


# ── Channel discovery ────────────────────────────────────────────────────────

def discover_channel_id(youtube, creator_slug: str, display_name: str) -> str | None:
    """
    Search YouTube for the creator and find their channel.
    Returns channel_id after user confirms, or None if skipped.
    """
    print(f"\n  Discovering channel for {display_name}...")

    cache_key = f"channel_search_{creator_slug}"
    results = yt_request_cached(
        cache_key,
        lambda: youtube.search().list(
            q=f"{display_name} UFC predictions",
            type="video",
            maxResults=15,
            part="snippet",
        ).execute(),
    )

    # Tally video counts per channel
    channel_counts: dict[str, int] = {}
    channel_names: dict[str, str] = {}
    for item in results.get("items", []):
        cid = item["snippet"]["channelId"]
        cname = item["snippet"]["channelTitle"]
        channel_counts[cid] = channel_counts.get(cid, 0) + 1
        channel_names[cid] = cname

    if not channel_counts:
        print(f"  No results found for {display_name}.")
        return None

    # Sort by count descending
    ranked = sorted(channel_counts.items(), key=lambda x: -x[1])

    print(f"\n  Top candidate channels for '{display_name}':")
    for i, (cid, cnt) in enumerate(ranked[:3], 1):
        print(f"    [{i}] {channel_names[cid]} (ID: {cid}) — {cnt} matching videos")

    best_id, best_count = ranked[0]
    best_name = channel_names[best_id]
    print(f"\n  Best match: {best_name} (ID: {best_id})")
    answer = input("  Is this the correct channel? [y/n/skip]: ").strip().lower()

    if answer == "y":
        return best_id
    elif answer in ("n", "no"):
        manual = input("  Enter the correct channel ID manually (or press Enter to skip): ").strip()
        return manual if manual else None
    else:
        print(f"  Skipping {display_name}.")
        return None


# ── Video fetching ───────────────────────────────────────────────────────────

def get_uploads_playlist_id(youtube, channel_id: str) -> str:
    cache_key = f"uploads_playlist_{channel_id}"
    result = yt_request_cached(
        cache_key,
        lambda: youtube.channels().list(
            id=channel_id, part="contentDetails"
        ).execute(),
    )
    return result["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]


def fetch_all_channel_videos(youtube, channel_id: str, cutoff: date) -> list[dict]:
    """
    Fetch all videos from a channel's uploads playlist going back to cutoff date.
    Costs 1 quota unit per 50 videos. Results cached per channel.
    """
    cache_key = f"all_videos_{channel_id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    playlist_id = get_uploads_playlist_id(youtube, channel_id)
    videos = []
    page_token = None
    page = 0
    stop = False

    while not stop:
        page += 1
        pk = f"playlist_{playlist_id}_p{page}"

        def _fetch(pt=page_token, pid=playlist_id):
            req = youtube.playlistItems().list(
                playlistId=pid,
                part="snippet",
                maxResults=50,
                pageToken=pt,
            )
            return req.execute()

        # Can't cache mid-pagination since tokens change — fetch live
        try:
            resp = _fetch()
        except HttpError as e:
            print(f"  YouTube API error on page {page}: {e}", file=sys.stderr)
            break

        for item in resp.get("items", []):
            snippet = item["snippet"]
            published_str = snippet.get("publishedAt", "")
            if not published_str:
                continue
            pub_date = date.fromisoformat(published_str[:10])
            if pub_date < cutoff:
                stop = True
                break
            rid = snippet.get("resourceId", {})
            vid = rid.get("videoId")
            if not vid:
                continue
            videos.append({
                "video_id": vid,
                "title": snippet.get("title", ""),
                "published_at": pub_date.isoformat(),
            })

        page_token = resp.get("nextPageToken")
        if not page_token:
            break

        time.sleep(0.2)

    cache_set(cache_key, videos)
    return videos


# ── Title filtering ──────────────────────────────────────────────────────────

EXCLUDE_PATTERNS = [
    "live chat", "livechat", "livestream", "live stream",
    "recap", "reaction",
    "early prediction",  # single-fight reaction/announcement vids
    "press conference",
    "breaking news",
]


def is_prediction_video(title: str) -> bool:
    tl = title.lower()
    if not ("ufc" in tl and any(kw in tl for kw in PREDICTION_KEYWORDS)):
        return False
    if any(pat in tl for pat in EXCLUDE_PATTERNS):
        return False
    return True


def prediction_keyword_count(title: str) -> int:
    tl = title.lower()
    return sum(1 for kw in PREDICTION_KEYWORDS if kw in tl)


# ── Event matching ───────────────────────────────────────────────────────────

def extract_event_number(title: str) -> str | None:
    """Extract UFC event number from title, e.g. '300' from 'UFC 300 Predictions'."""
    m = re.search(r'\bufc\s*(\d{3,})\b', title.lower())
    return m.group(1) if m else None


def match_video_to_event(video: dict, events: list[dict], events_by_num: dict) -> dict | None:
    """
    Match a video to the most appropriate event.
    Primary: extract UFC number from title and look up directly.
    Fallback: date-based matching (published 0-14 days before event).
    """
    pub_date = date.fromisoformat(video["published_at"])
    title = video["title"]

    # 1. Try number-based match
    num = extract_event_number(title)
    if num and num in events_by_num:
        event = events_by_num[num]
        event_date = date.fromisoformat(event["date"])
        days_before = (event_date - pub_date).days
        if 0 <= days_before <= 14:  # Must be published before (or on) event day
            return event

    # 2. Date-based fallback
    candidates = []
    for event in events:
        event_date = date.fromisoformat(event["date"])
        days_before = (event_date - pub_date).days
        if 0 <= days_before <= MAX_DAYS_BEFORE:
            score = (MAX_DAYS_BEFORE - days_before) + prediction_keyword_count(title) * 2
            candidates.append((event, days_before, score))

    if not candidates:
        return None

    # Prefer highest score (closest to event + most keywords)
    candidates.sort(key=lambda x: -x[2])
    return candidates[0][0]


def build_events_index(events: list[dict]) -> dict:
    """Index events by their numeric suffix for fast title matching."""
    idx = {}
    for event in events:
        m = re.match(r"ufc-(\d+)$", event["event_id"])
        if m:
            idx[m.group(1)] = event
    return idx


# ── Per-creator discovery ────────────────────────────────────────────────────

def discover_for_creator(
    youtube,
    creator_slug: str,
    channel_id: str,
    events: list[dict],
    events_by_num: dict,
    existing_video_ids: set,
    cutoff: date,
) -> list[dict]:
    """
    Fetch all videos from channel, filter to prediction videos, match to events.
    Returns new manifest entries (not already in manifest).
    """
    all_videos = fetch_all_channel_videos(youtube, channel_id, cutoff)
    pred_videos = [v for v in all_videos if is_prediction_video(v["title"])]

    # For each event, collect candidate videos
    event_candidates: dict[str, list] = defaultdict(list)
    unmatched = []

    for video in pred_videos:
        if video["video_id"] in existing_video_ids:
            continue
        event = match_video_to_event(video, events, events_by_num)
        if event:
            days_before = (date.fromisoformat(event["date"]) - date.fromisoformat(video["published_at"])).days
            score = (MAX_DAYS_BEFORE - max(days_before, 0)) + prediction_keyword_count(video["title"]) * 2
            event_candidates[event["event_id"]].append((video, score))
        else:
            unmatched.append(video)

    # Per event: pick the best video
    new_entries = []
    for event_id, candidates in event_candidates.items():
        best_video, _ = max(candidates, key=lambda x: x[1])
        new_entries.append({
            "creator": creator_slug,
            "event_id": event_id,
            "video_id": best_video["video_id"],
            "title": best_video["title"],
            "published_at": best_video["published_at"],
            "status": "pending",
            "transcript_type": None,
            "predictions_extracted": 0,
            "flagged_count": 0,
            "skipped_count": 0,
            "processed_at": None,
        })

    display = CREATORS[creator_slug]["display_name"]
    matched = len(new_entries)
    print(
        f"  {display}: {len(all_videos)} total videos, "
        f"{len(pred_videos)} prediction videos, "
        f"{matched} matched to events, "
        f"{len(unmatched)} unmatched"
    )

    return new_entries


# ── Main ─────────────────────────────────────────────────────────────────────

def run(creator_slugs: list[str] | None = None, dry_run: bool = False) -> list[dict]:
    """
    Discover videos for the given creators (or all if None).
    Returns all new manifest entries added.
    """
    events = json.loads(EVENTS_FILE.read_text())
    events_by_num = build_events_index(events)
    cutoff = date.today() - timedelta(days=CUTOFF_DAYS)

    manifest = load_manifest()
    existing_video_ids = {e["video_id"] for e in manifest}
    existing_count = len(manifest)

    channels_cache = load_channels_cache()
    youtube = build_youtube()

    slugs = creator_slugs or list(CREATORS.keys())
    all_new_entries: list[dict] = []

    for slug in slugs:
        config = CREATORS.get(slug)
        if not config:
            print(f"Unknown creator: {slug}", file=sys.stderr)
            continue

        print(f"\n[{config['display_name']}]")

        # Resolve channel_id
        channel_id = channels_cache.get(slug) or config["channel_id"]

        if not channel_id:
            channel_id = discover_channel_id(youtube, slug, config["display_name"])
            if channel_id:
                channels_cache[slug] = channel_id
                save_channels_cache(channels_cache)
            else:
                print(f"  Skipping {config['display_name']} — no channel resolved.")
                continue
        else:
            if slug not in channels_cache and config["channel_id"]:
                channels_cache[slug] = channel_id
                save_channels_cache(channels_cache)

        try:
            new_entries = discover_for_creator(
                youtube, slug, channel_id, events, events_by_num,
                existing_video_ids, cutoff,
            )
        except HttpError as e:
            print(f"  YouTube API error for {slug}: {e}", file=sys.stderr)
            continue

        all_new_entries.extend(new_entries)

    if not dry_run:
        manifest.extend(all_new_entries)
        save_manifest(manifest)
        print(f"\nManifest: {existing_count} existing + {len(all_new_entries)} new = {len(manifest)} total")
    else:
        print(f"\n[DRY RUN] Would add {len(all_new_entries)} new manifest entries")

    return all_new_entries


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--creator", default="all")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    slugs = None if args.creator == "all" else [args.creator]
    run(slugs, dry_run=args.dry_run)
