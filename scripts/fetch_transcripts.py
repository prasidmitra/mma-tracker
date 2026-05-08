#!/usr/bin/env python3
"""
Task 2B: Fetch YouTube transcripts in memory.

Never writes transcripts to disk. Returns (text, transcript_type) tuple.
transcript_type: "manual" | "auto"

YouTube IP-block workaround:
  Set YOUTUBE_COOKIES_PATH in .env (or the environment) to the path of a
  Netscape-format cookies file exported from your browser while logged in to
  YouTube (e.g. via the "Get cookies.txt LOCALLY" Chrome extension).

  Note: youtube-transcript-api v1.2.4 has cookies_path commented out internally,
  so we load the file manually into a requests.Session and pass it as http_client.
"""

import http.cookiejar
import os
import random
import re
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    IpBlocked,
    NoTranscriptFound,
    RequestBlocked,
    TranscriptsDisabled,
    VideoUnavailable,
)

load_dotenv()

LANG_PREFERENCES = ["en", "en-US", "en-GB", "en-CA", "en-AU"]


def _cookies_path() -> Path | None:
    raw = os.getenv("YOUTUBE_COOKIES_PATH", "").strip()
    if not raw:
        return None
    p = Path(raw).expanduser()
    return p if p.exists() else None


class TranscriptUnavailable(Exception):
    pass


class TranscriptRateLimited(Exception):
    """YouTube is rate-limiting this IP. Temporary — retry after a delay."""
    pass


def _build_api() -> YouTubeTranscriptApi:
    """Build API instance, injecting browser cookies via http_client if configured."""
    cp = _cookies_path()
    if cp:
        jar = http.cookiejar.MozillaCookieJar()
        try:
            jar.load(str(cp), ignore_discard=True, ignore_expires=True)
            session = requests.Session()
            session.cookies = jar  # type: ignore[assignment]
            print(f"  [transcript] Using cookies from {cp}", file=sys.stderr)
            return YouTubeTranscriptApi(http_client=session)
        except Exception as e:
            print(f"  WARN: Could not load cookie file {cp}: {e}", file=sys.stderr)
    return YouTubeTranscriptApi()


# Module-level singleton — rebuilt whenever the cookies file path or mtime changes
_api_instance: YouTubeTranscriptApi | None = None
_last_cookies_key: tuple = ()


def _get_api() -> YouTubeTranscriptApi:
    global _api_instance, _last_cookies_key
    cp = _cookies_path()
    mtime = cp.stat().st_mtime if cp else 0.0
    key = (str(cp), mtime)
    if _api_instance is None or key != _last_cookies_key:
        _api_instance = _build_api()
        _last_cookies_key = key
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
    except (IpBlocked, RequestBlocked):
        raise TranscriptRateLimited(
            "YouTube is rate-limiting this IP on transcript fetching. "
            "This is temporary — wait a few hours and retry. "
            "Using a VPN or mobile hotspot will bypass this immediately."
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

    time.sleep(random.uniform(30, 60))  # gap between list() and fetch() to avoid rate limits

    try:
        fetched = transcript.fetch()
        segments = list(fetched)
    except (IpBlocked, RequestBlocked):
        raise TranscriptRateLimited(
            "YouTube is rate-limiting this IP on transcript fetching. "
            "Wait a few hours or switch to a different network/VPN."
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
    """Fetch transcript with retry on transient errors; no retry on permanent or rate-limit errors."""
    last_err = None
    for attempt in range(retries + 1):
        try:
            return fetch_transcript(video_id)
        except (TranscriptUnavailable, TranscriptRateLimited):
            raise  # Don't retry these
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
