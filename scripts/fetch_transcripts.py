#!/usr/bin/env python3
"""
Task 2B: Fetch YouTube transcripts in memory.

Never writes transcripts to disk. Returns (text, transcript_type) tuple.
transcript_type: "manual" | "auto"

YouTube IP-block workaround:
  Export cookies from your logged-in browser using the "Get cookies.txt LOCALLY"
  Chrome extension (or equivalent), save as cookies.txt in the project root.
  The script picks them up automatically.
"""

import http.cookiejar
import re
import sys
import time
from pathlib import Path

import requests
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    IpBlocked,
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)

ROOT = Path(__file__).parent.parent
COOKIES_FILE = ROOT / "cookies.txt"

LANG_PREFERENCES = ["en", "en-US", "en-GB", "en-CA", "en-AU"]


class TranscriptUnavailable(Exception):
    pass


def _build_api() -> YouTubeTranscriptApi:
    """Build API instance, loading browser cookies if cookies.txt exists."""
    if COOKIES_FILE.exists():
        jar = http.cookiejar.MozillaCookieJar()
        try:
            jar.load(str(COOKIES_FILE), ignore_discard=True, ignore_expires=True)
            session = requests.Session()
            session.cookies = jar
            return YouTubeTranscriptApi(http_client=session)
        except Exception as e:
            print(f"  WARN: Could not load cookies.txt: {e}", file=sys.stderr)
    return YouTubeTranscriptApi()


# Module-level singleton (rebuilt if cookies.txt changes)
_api_instance: YouTubeTranscriptApi | None = None
_cookies_mtime: float = 0.0


def _get_api() -> YouTubeTranscriptApi:
    global _api_instance, _cookies_mtime
    current_mtime = COOKIES_FILE.stat().st_mtime if COOKIES_FILE.exists() else 0.0
    if _api_instance is None or current_mtime != _cookies_mtime:
        _api_instance = _build_api()
        _cookies_mtime = current_mtime
    return _api_instance


def fetch_transcript(video_id: str) -> tuple[str, str]:
    """
    Fetch and clean transcript for a YouTube video.

    Returns:
        (text, transcript_type) where transcript_type is "manual" or "auto"

    Raises:
        TranscriptUnavailable if no English transcript exists or YouTube blocks.
    """
    api = _get_api()

    try:
        transcript_list = api.list(video_id)
    except IpBlocked as e:
        raise TranscriptUnavailable(
            "IP blocked by YouTube. Add cookies.txt to project root to fix this. "
            "See scripts/fetch_transcripts.py docstring for instructions."
        )
    except (VideoUnavailable, TranscriptsDisabled) as e:
        raise TranscriptUnavailable(str(e))
    except Exception as e:
        raise TranscriptUnavailable(f"API error: {e}")

    transcript = None
    transcript_type = None

    # Prefer manually created transcripts (better quality)
    try:
        transcript = transcript_list.find_manually_created_transcript(LANG_PREFERENCES)
        transcript_type = "manual"
    except NoTranscriptFound:
        pass

    # Fall back to auto-generated
    if transcript is None:
        try:
            transcript = transcript_list.find_generated_transcript(LANG_PREFERENCES)
            transcript_type = "auto"
        except NoTranscriptFound:
            pass

    if transcript is None:
        raise TranscriptUnavailable("No English transcript available")

    try:
        # v1.2.4+: fetch() returns FetchedTranscript, iterate to get FetchedTranscriptSnippet
        # Each snippet has .text (str), .start (float), .duration (float)
        fetched = transcript.fetch()
        segments = list(fetched)
    except IpBlocked:
        raise TranscriptUnavailable(
            "IP blocked fetching segments. Add cookies.txt to project root."
        )
    except Exception as e:
        raise TranscriptUnavailable(f"Failed to fetch segments: {e}")

    parts = []
    for seg in segments:
        text = seg.text if hasattr(seg, "text") else str(seg)
        text = re.sub(r"\[.*?\]", "", text).strip()   # strip [Music], [Applause]
        if text:
            parts.append(text)

    cleaned = " ".join(parts)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned, transcript_type


def fetch_with_retry(video_id: str, retries: int = 2) -> tuple[str, str]:
    """Fetch transcript with retry on transient errors; no retry on permanent ones."""
    last_err = None
    for attempt in range(retries + 1):
        try:
            return fetch_transcript(video_id)
        except TranscriptUnavailable:
            raise  # Permanent — don't retry
        except Exception as e:
            last_err = e
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
    raise TranscriptUnavailable(f"Failed after {retries + 1} attempts: {last_err}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: fetch_transcripts.py <video_id>")
        sys.exit(1)
    vid = sys.argv[1]
    try:
        text, t_type = fetch_transcript(vid)
        word_count = len(text.split())
        print(f"Type: {t_type} | Words: {word_count}")
        print("First 500 chars:", text[:500])
    except TranscriptUnavailable as e:
        print(f"No transcript: {e}")
        sys.exit(1)
