"""
scripts/utils/market_hours.py

Determines gold market session status by reading market_sessions.json.
All times are handled in UTC internally; GST (UTC+4) is used only for display.
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from utils.logger import get_logger

log = get_logger("market_hours")

_CONFIG_DIR = Path(__file__).resolve().parent.parent.parent / "config" / "twitter_bot"

# GST is UTC+4 (Gulf Standard Time)
GST = timezone(timedelta(hours=4))

# Window in minutes to detect session open/close events
EVENT_WINDOW_MINUTES = 5


def _load_sessions() -> Dict[str, Any]:
    filepath = _CONFIG_DIR / "market_sessions.json"
    with open(filepath, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _parse_time(time_str: str) -> tuple:
    """Parse 'HH:MM' into (hour, minute) tuple."""
    parts = time_str.split(":")
    return int(parts[0]), int(parts[1])


def _utc_now() -> datetime:
    """Return current UTC time. Separate function for testability."""
    return datetime.now(timezone.utc)


def _iso_weekday_from_python(py_weekday: int) -> int:
    """Convert Python weekday (0=Mon) to our config format (0=Mon..6=Sun)."""
    return py_weekday


def get_active_sessions(now: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """
    Return list of sessions that are currently active.
    Each entry includes the session dict plus an 'is_active' flag.
    """
    if now is None:
        now = _utc_now()

    config = _load_sessions()
    sessions = config.get("sessions", [])
    iso_weekday = _iso_weekday_from_python(now.weekday())  # 0=Mon..6=Sun
    current_minutes = now.hour * 60 + now.minute

    active = []
    for session in sessions:
        if iso_weekday not in session.get("active_days", []):
            continue

        open_h, open_m = _parse_time(session["open_utc"])
        close_h, close_m = _parse_time(session["close_utc"])
        open_minutes = open_h * 60 + open_m
        close_minutes = close_h * 60 + close_m

        if close_minutes > open_minutes:
            # Normal session (e.g., 08:00 – 17:00)
            if open_minutes <= current_minutes < close_minutes:
                active.append(session)
        else:
            # Overnight session (e.g., 22:00 – 07:00)
            if current_minutes >= open_minutes or current_minutes < close_minutes:
                active.append(session)

    return active


def is_any_market_open(now: Optional[datetime] = None) -> bool:
    """Check whether any gold market session is currently active."""
    return len(get_active_sessions(now)) > 0


def get_market_status_text(now: Optional[datetime] = None) -> str:
    """
    Return a human-readable market status line for tweets.
    Names the active sessions or states market is closed.
    """
    active = get_active_sessions(now)
    if active:
        names = [s["name"] for s in active]
        return f"🟢 Market Open: {', '.join(names)}"
    return "🔴 Market Closed — showing last available price"


def get_session_event(now: Optional[datetime] = None) -> Optional[Dict[str, Any]]:
    """
    Check if the current time is within EVENT_WINDOW_MINUTES of any session
    opening or closing.

    Returns a dict with:
        session_name  – name of the session
        event_type    – 'open' or 'close'
        session       – the full session dict
    Or None if no event is happening.
    """
    if now is None:
        now = _utc_now()

    config = _load_sessions()
    sessions = config.get("sessions", [])
    iso_weekday = _iso_weekday_from_python(now.weekday())
    current_minutes = now.hour * 60 + now.minute

    for session in sessions:
        if iso_weekday not in session.get("active_days", []):
            continue

        open_h, open_m = _parse_time(session["open_utc"])
        close_h, close_m = _parse_time(session["close_utc"])
        open_minutes = open_h * 60 + open_m
        close_minutes = close_h * 60 + close_m

        # Check if within EVENT_WINDOW_MINUTES of open
        if abs(current_minutes - open_minutes) <= EVENT_WINDOW_MINUTES:
            log.info(
                "Session event detected: %s OPEN (current=%d, open=%d)",
                session["name"],
                current_minutes,
                open_minutes,
            )
            return {
                "session_name": session["name"],
                "event_type": "open",
                "session": session,
            }

        # Check if within EVENT_WINDOW_MINUTES of close
        if abs(current_minutes - close_minutes) <= EVENT_WINDOW_MINUTES:
            log.info(
                "Session event detected: %s CLOSE (current=%d, close=%d)",
                session["name"],
                current_minutes,
                close_minutes,
            )
            return {
                "session_name": session["name"],
                "event_type": "close",
                "session": session,
            }

    return None


def format_time_gst(now: Optional[datetime] = None) -> str:
    """Format current time in GST (UTC+4) for tweet display."""
    if now is None:
        now = _utc_now()
    gst_time = now.astimezone(GST)
    return gst_time.strftime("%I:%M %p").lstrip("0")


def is_weekend(now: Optional[datetime] = None) -> bool:
    """Check if the global gold market is closed for the weekend."""
    if now is None:
        now = _utc_now()

    config = _load_sessions()
    gm = config.get("global_market", {})
    weekly_open = gm.get("weekly_open", {})
    weekly_close = gm.get("weekly_close", {})

    iso_weekday = now.weekday()  # 0=Mon..6=Sun
    current_minutes = now.hour * 60 + now.minute

    close_day = weekly_close.get("day", 4)  # Friday
    close_h, close_m = _parse_time(weekly_close.get("time_utc", "18:00"))
    close_minutes = close_h * 60 + close_m

    open_day = weekly_open.get("day", 6)  # Sunday
    open_h, open_m = _parse_time(weekly_open.get("time_utc", "22:00"))
    open_minutes = open_h * 60 + open_m

    # Weekend = after Friday close until Sunday open
    if iso_weekday == close_day and current_minutes >= close_minutes:
        return True
    if iso_weekday == 5:  # Saturday
        return True
    if iso_weekday == open_day and current_minutes < open_minutes:
        return True

    return False
