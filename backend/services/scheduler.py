"""
Timetable generation service.
Takes subject study times and user preferences to produce a daily study schedule.
"""

from datetime import datetime, timedelta
from typing import Optional
import uuid
import math

# Session duration constraints (minutes)
MIN_SESSION_MINUTES = 25
MAX_SESSION_MINUTES = 90
BREAK_MINUTES = 10

# Time block definitions (24h format)
TIME_BLOCKS = {
    "Morning (6-12)": (6, 12),
    "Afternoon (12-18)": (12, 18),
    "Evening (18-24)": (18, 24),
}

# Session types based on duration
SESSION_TYPES = {
    (0, 30): "Quick recap",
    (30, 60): "Review",
    (60, 91): "Deep focus",
}


def get_session_type(duration_minutes: int) -> str:
    for (low, high), label in SESSION_TYPES.items():
        if low <= duration_minutes < high:
            return label
    return "Deep focus"


def generate_timetable(
    subjects: list[dict],
    hours_per_day: float = 4.0,
    preferred_blocks: list[str] | None = None,
    exam_date: str | None = None,
    days_count: int = 7,
    learner_speed: str = "medium",
    will_take_notes: bool = False,
) -> dict:
    """
    Generate a study timetable.

    Args:
        subjects: List of dicts with keys: id, name, color, total_study_minutes
        hours_per_day: How many hours the user can study per day
        preferred_blocks: e.g. ["Morning (6-12)", "Afternoon (12-18)"]
        exam_date: Optional ISO date string for the exam
        days_count: Number of days to plan for (default 7)
        learner_speed: "slow", "medium", or "fast"
        will_take_notes: Whether the user will take notes (adds extra time)

    Returns:
        dict with sessions list, total_hours, days, subjects_covered
    """
    if not subjects:
        return {"sessions": [], "total_hours": 0, "days": 0, "subjects_covered": 0}

    if preferred_blocks is None:
        preferred_blocks = ["Morning (6-12)", "Afternoon (12-18)"]

    # ── Apply learner speed & note-taking multipliers ─────────
    speed_multipliers = {"slow": 1.5, "medium": 1.0, "fast": 0.7}
    speed_mult = speed_multipliers.get(learner_speed, 1.0)
    notes_mult = 1.3 if will_take_notes else 1.0

    # Scale each subject's study time
    for subj in subjects:
        base_minutes = subj.get("total_study_minutes", 60)
        subj["total_study_minutes"] = round(base_minutes * speed_mult * notes_mult)

    # Calculate available minutes per day
    minutes_per_day = hours_per_day * 60

    # If exam date is provided, calculate actual days available
    if exam_date:
        try:
            exam_dt = datetime.fromisoformat(exam_date)
            today = datetime.now()
            delta = (exam_dt - today).days
            if delta > 0:
                days_count = min(delta, days_count)
        except ValueError:
            pass

    # Build available time slots from preferred blocks
    available_slots = []
    for block_name in preferred_blocks:
        if block_name in TIME_BLOCKS:
            start_hour, end_hour = TIME_BLOCKS[block_name]
            available_slots.append((start_hour, end_hour))

    if not available_slots:
        available_slots = [(9, 12), (14, 18)]  # Default slots

    # Sort slots chronologically
    available_slots.sort(key=lambda x: x[0])

    # Calculate total study time needed across all subjects (trackers)
    for subj in subjects:
        subj["remaining"] = subj["total_study_minutes"]
    
    total_needed_original = sum(s["total_study_minutes"] for s in subjects)

    sessions = []
    today = datetime.now()
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for day_offset in range(days_count):
        current_date = today + timedelta(days=day_offset)
        day_name = day_names[current_date.weekday()]

        remaining_minutes_today = minutes_per_day
        current_slot_idx = 0
        current_minute_in_slot = 0  # minutes into current slot

        # For this day, we target a proportional chunk of each subject's remaining total
        # to ensure even distribution across days_count.
        days_left = days_count - day_offset
        
        for subject in subjects:
            if subject["remaining"] <= 0 or remaining_minutes_today < MIN_SESSION_MINUTES:
                continue

            # Target for today: spread what's left over days_left.
            target_today = subject["remaining"] / days_left
            
            # Constraint by daily hours.
            subj_daily_minutes = min(max(target_today, MIN_SESSION_MINUTES), remaining_minutes_today, subject["remaining"])

            # Only skip if we truly have nothing left or the chunk is too tiny to be useful (and isn't the final chunk)
            if subj_daily_minutes < 5: 
                continue

            # Split into sessions
            time_left_for_subject_today = subj_daily_minutes
            while time_left_for_subject_today > 0 and remaining_minutes_today >= 5:
                if current_slot_idx >= len(available_slots):
                    break

                slot_start, slot_end = available_slots[current_slot_idx]
                slot_total_minutes = (slot_end - slot_start) * 60
                slot_remaining = slot_total_minutes - current_minute_in_slot

                if slot_remaining < MIN_SESSION_MINUTES:
                    current_slot_idx += 1
                    current_minute_in_slot = 0
                    continue

                session_dur = min(
                    MAX_SESSION_MINUTES,
                    time_left_for_subject_today,
                    slot_remaining,
                    remaining_minutes_today,
                    subject["remaining"]
                )

                if session_dur < MIN_SESSION_MINUTES:
                    break

                start_hour = slot_start + current_minute_in_slot // 60
                start_min = current_minute_in_slot % 60

                session = {
                    "id": str(uuid.uuid4()),
                    "subject": subject["name"],
                    "subject_color": subject.get("color", "#8B5CF6"),
                    "title": f"{subject['name']} Study Session",
                    "duration": int(session_dur),
                    "start_time": f"{start_hour:02d}:{start_min:02d}",
                    "day": day_name,
                    "session_type": get_session_type(int(session_dur)),
                }
                sessions.append(session)

                advance = session_dur + BREAK_MINUTES
                current_minute_in_slot += advance
                remaining_minutes_today -= session_dur
                time_left_for_subject_today -= session_dur
                subject["remaining"] -= session_dur

                if current_minute_in_slot >= slot_total_minutes:
                    current_slot_idx += 1
                    current_minute_in_slot = 0

    total_session_minutes = sum(s["duration"] for s in sessions)

    return {
        "sessions": sessions,
        "total_hours": round(total_session_minutes / 60, 1),
        "days": days_count,
        "subjects_covered": len(set(s["subject"] for s in sessions)),
    }
