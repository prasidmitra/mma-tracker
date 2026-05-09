#!/usr/bin/env python3
"""
Fetch YouTube channel profile pictures for all creators with known channel IDs.
Saves images to src/public/avatars/{creator_slug}.jpg
"""

import json
import os
import urllib.request
from pathlib import Path

from dotenv import load_dotenv
from googleapiclient.discovery import build

load_dotenv()

ROOT = Path(__file__).parent.parent
CHANNELS_CACHE = ROOT / "data" / "channels_cache.json"
OUT_DIR = ROOT / "src" / "public" / "avatars"

# Full creator list — slugs must match CREATOR_DISPLAY keys in the frontend
ALL_CREATORS = [
    "mma_guru",
    "mma_joey",
    "sneaky_mma",
    "brendan_schaub",
    "luke_thomas",
    "the_weasel",
    "bedtime_mma",
    "lucas_tracy_mma",
]


def main():
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        raise SystemExit("YOUTUBE_API_KEY not set in environment")

    channel_ids: dict[str, str] = json.loads(CHANNELS_CACHE.read_text())

    missing = [c for c in ALL_CREATORS if c not in channel_ids]
    if missing:
        print(f"⚠  No channel ID for: {', '.join(missing)} — skipping these")

    known = {slug: cid for slug, cid in channel_ids.items() if slug in ALL_CREATORS}
    if not known:
        raise SystemExit("No channel IDs to fetch")

    youtube = build("youtube", "v3", developerKey=api_key)

    # Batch-fetch all channels in one API call
    resp = youtube.channels().list(
        part="snippet",
        id=",".join(known.values()),
        maxResults=50,
    ).execute()

    # Map channel_id → thumbnail URL (prefer high > medium > default)
    cid_to_thumb: dict[str, str] = {}
    for item in resp.get("items", []):
        cid = item["id"]
        thumbs = item["snippet"]["thumbnails"]
        url = (
            thumbs.get("high", {}).get("url")
            or thumbs.get("medium", {}).get("url")
            or thumbs.get("default", {}).get("url")
        )
        if url:
            cid_to_thumb[cid] = url

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for slug, cid in known.items():
        url = cid_to_thumb.get(cid)
        if not url:
            print(f"✗  {slug}: no thumbnail returned by API")
            continue

        out_path = OUT_DIR / f"{slug}.jpg"
        urllib.request.urlretrieve(url, out_path)
        print(f"✓  {slug}: saved {out_path.relative_to(ROOT)}  ({url})")

    print(f"\nDone. {len(cid_to_thumb)} avatars saved to {OUT_DIR.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
