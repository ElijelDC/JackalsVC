#!/usr/bin/env python3
"""Build planTemplateVersion 5 JSON from ultimate-setter-preseason-plan.html tables."""
import json
import re
from pathlib import Path

HTML = Path("/opt/cursor/artifacts/ultimate-setter-preseason-plan.html")


def ex(name, category, sets, reps, load="—", rest_sec=60, notes=""):
    return {
        "name": name,
        "category": category,
        "sets": int(sets),
        "reps": str(reps),
        "load": load,
        "restSec": int(rest_sec),
        "notes": notes,
    }


def mon_gym(taper=False):
    s_leg, s_upper = (2 if taper else 4, 2 if taper else 3)
    jumps = "2×3" if taper else "3×4"
    return [
        ex("Leg press or hack squat", "strength", s_leg, "8–10", "RPE 7", 105, "Main leg strength"),
        ex("Leg curl", "strength", s_upper, "10–12", "Moderate", 75, "Knee support"),
        ex("Hip thrust", "strength", s_upper, "10", "Moderate", 90, "Jump power"),
        ex("Step-up (box or bench)", "strength", s_upper, "8/leg", "Moderate", 90, "Single-leg strength"),
        ex("Standing calf raise", "strength", s_upper, "12–15", "Moderate", 60, "Ankle / last inch of jump"),
        ex("Machine chest press or neutral-grip DB bench", "strength", s_upper, "8–10", "RPE 7", 75, "Chest / push"),
        ex(
            "Cable row + tricep pushdown → block jumps",
            "strength",
            s_upper,
            f"10 each · then {jumps} jumps",
            "Moderate",
            90,
            "Back + arms; finish block jumps on gym floor",
        ),
    ]


def tue_home():
    return [
        ex("Shoulder rehab — ER towel + scap push-up plus", "mobility", 3, "20s hold + 10 reps", "Light", 45, "Right shoulder"),
        ex("Knee/hip/ankle — wall sit + reverse lunge + calf raise", "strength", 3, "30s · 8/leg · 12/leg", "Bodyweight", 60, "Knee support"),
        ex("1 kg wall sets (high finish)", "skill", 3, "25", "1 kg ball", 45, "Quiet wrists"),
        ex("Volleyball sets to taped X", "skill", 3, "15", "Volleyball", 45, "Accuracy"),
        ex("Shuffle 3 steps L/R → set to wall", "skill", 2, "10 each way", "—", 45, "Footwork + set"),
    ]


def wed_gym(taper=False):
    s = 2 if taper else 3
    exercises = [
        ex("Leg press (moderate load)", "strength", s, "10–12", "RPE 6", 90, "Not a max day — finish by 15:00"),
        ex("Leg curl", "strength", s, "10–12", "Moderate", 75, "Hamstring / knee support"),
        ex("Hip thrust", "strength", s, "10", "Moderate", 90, "Controlled glutes"),
        ex("Standing or seated calf raise", "strength", s, "12–15", "Moderate", 60, "Ankle stiffness for blocking"),
        ex("Incline machine press or landmine press", "strength", s, "8–10", "RPE 6", 75, "Skip if shoulder >3/10"),
        ex("Cable row + band external rotation", "strength", s, "10 row · 12 ER/side", "Moderate", 75, "Back + right shoulder"),
    ]
    if not taper:
        exercises.append(
            ex("Face pull + Pallof press", "strength", 3, "15 · 10/side", "Light", 60, "Optional 7th — posture + core")
        )
    return exercises


def wed_club():
    return [
        ex("Prehab before team warm-up", "mobility", 1, "12 min", "—", 0, "TKE, balance, ER — quick OK"),
        ex("Blocking — late read, hands over net", "skill", 1, "Wed club", "Live", 0, "Penetrate with MB; call early"),
        ex("Setting — wrists, shorten range if needed", "skill", 1, "Wed club", "Live", 0, "Transfer gym + home work"),
        ex("Recovery — ice if hot; no gym after", "mobility", 1, "Post-session", "—", 0, "No Flyefit after club"),
    ]


def thu_home(light=False):
    jump_sets = 3 if light else 5
    return [
        ex("3-step approach jump — touch wall mark", "plyo", jump_sets, "3", "Max touch", 75, "Stop if knee >3/10"),
        ex("Two-foot block jump (tape net line)", "plyo", 3 if light else 4, "4", "—", 75, "Hands to tape line"),
        ex("Lateral shuffle ~3 m + block jump", "plyo", 3 if light else 4, "3/side", "—", 75, "Blocking transfer"),
        ex("Jump-set to wall (or hand set if sore)", "skill", 3, "10", "Volleyball", 60, "Or hand set if knee sore"),
        ex("1 kg quick sets", "skill", 2, "20", "1 kg ball", 45, "Tempo hands"),
        ex("Back set + dump footwork to wall", "skill", 2, "12 back · 10 dump", "—", 60, "Deception footwork"),
    ]


def fri_gym(taper=False, match_week=False):
    if match_week:
        return [
            ex("12 min prehab only", "mobility", 1, "12 min", "—", 0, "10 Oct: no gym — prehab + optional easy wall sets"),
            ex("Easy 1 kg wall sets (optional)", "skill", 1, "20", "Light", 0, "Only if shoulders feel great"),
        ]
    s_main, s_acc = (2 if taper else 4, 2 if taper else 3)
    return [
        ex("Goblet squat or leg press", "strength", s_main, "6–8", "RPE 7–8", 105, "Heavy legs — no jumping"),
        ex("Romanian deadlift", "strength", s_acc, "8", "Moderate", 90, "Hamstrings"),
        ex("Split squat or walking lunge", "strength", s_acc, "8/leg", "Moderate", 90, "Short steps if knees sensitive"),
        ex("Lat pulldown or assisted pull-up", "strength", s_acc, "8–10", "Moderate", 75, "Back"),
        ex("Seated cable row or chest-supported row", "strength", s_acc, "10", "Moderate", 75, "Squeeze 1 sec"),
        ex("Face pull (or band pull-apart)", "strength", s_acc, "15", "Light", 60, "Right shoulder / posture"),
        ex("Bicep curl + Pallof press", "strength", s_acc, "10 curls · 10/side Pallof", "Moderate", 60, "Arms + anti-rotation"),
    ]


def sat_home(light=False):
    return [
        ex("Short shuttle (5–8 m) + lateral shuffle", "conditioning", 6 if not light else 4, "down & back + shuffles", "—", 60, "No full-court suicides"),
        ex("Wall block line + approach jumps", "plyo", 3, "8 presses · 3×3 jumps", "—", 75, "Hallway or garden"),
        ex("Lateral shuffle + block jump to tape", "plyo", 3, "3/side", "—", 75, "Blocking pattern"),
        ex("Volleyball wall sets — 6 contacts/round", "skill", 6 if not light else 4, "6 contacts", "Volleyball", 45, "Game-like rhythm"),
        ex("1 kg four-way sets + targets to X", "skill", 2, "10/dir · 20 to X", "1 kg + ball", 45, "All directions"),
    ]


def sun_prehab():
    return [
        ex("Terminal knee extension (towel)", "mobility", 2, "15/leg", "Light", 30, "Knees"),
        ex("Sit-to-stand from chair, slow", "mobility", 2, "10", "Bodyweight", 30, "Knees"),
        ex("Glute bridge (2 sec squeeze)", "mobility", 2, "12", "—", 30, "Hips"),
        ex("Side-lying leg raise", "mobility", 2, "12/side", "—", 30, "Hips"),
        ex("Single-leg balance", "mobility", 2, "30 sec/side", "—", 30, "Ankle/knee"),
        ex("Ankle alphabet", "mobility", 1, "A–Z each foot", "—", 0, "Ankles"),
        ex("External rotation — towel or band", "mobility", 2, "12", "Light", 30, "Right shoulder"),
        ex("Wall scap push-up", "mobility", 2, "12", "—", 30, "Shoulder"),
        ex("Wrist circles + wall finger presses", "mobility", 2, "30s + 10", "—", 30, "Setting efficiency"),
    ]


def day(label, title, focus, rest, exercises):
    return {"label": label, "title": title, "focus": focus, "rest": rest, "exercises": exercises}


def week(name, theme, taper=False, match_week=False, load_week=False):
    thu_light = taper or match_week
    sat_light = taper or match_week
    w = [
        day(
            "Mon",
            "Flyefit · legs + push + block jumps",
            "7 exercises · prehab first · pain ≤3/10",
            False,
            mon_gym(taper=taper),
        ),
        day(
            "Tue",
            "Home · setting focus",
            "5 drills · wall X · 1 kg + volleyball",
            False,
            tue_home(),
        ),
        day(
            "Wed",
            "Flyefit AM + club PM",
            "Finish gym by 15:00 · VLY 19:00–21:00",
            False,
            wed_gym(taper=taper) + wed_club(),
        ),
        day(
            "Thu",
            "Home · jump + set day",
            "6 drills · mark touch height" + (" · light/skips if tired" if thu_light else ""),
            False,
            thu_home(light=thu_light),
        ),
        day(
            "Fri",
            "Flyefit · pull + legs" if not match_week else "Pre-match · no gym",
            "7 exercises · no jumping" if not match_week else "10 Oct rules",
            match_week,
            fri_gym(taper=taper, match_week=match_week),
        ),
        day(
            "Sat",
            "Home · shuttles + block + sets",
            "5 drills · no suicides" + (" · light ball" if sat_light else ""),
            False,
            sat_home(light=sat_light),
        ),
        day(
            "Sun",
            "Rest + prehab",
            "Track weekly metrics · 12 min protocol",
            True,
            sun_prehab(),
        ),
    ]
    if load_week:
        for d in w:
            if d["label"] in ("Mon", "Wed", "Fri") and not d["rest"]:
                for exd in d["exercises"]:
                    if exd["category"] == "strength" and exd["sets"] < 5:
                        exd["sets"] = min(exd["sets"] + 1, 5)
                        exd["notes"] = (exd["notes"] + " · Week 2 +load").strip(" ·")
    return {"name": name, "theme": theme, "days": w}


def main():
    tpl = {
        "planTemplateVersion": 5,
        "title": "Ultimate Setter Preseason",
        "subtitle": "VLY Div 2 · Match 11 Oct 2026 · Flyefit + home + Wed club",
        "weeks": [
            week("Week 1", "Baseline · jump touch + Tue/Thu/Sat ball routines"),
            week("Week 2", "+load Mon/Wed/Fri gym · Thu jumps if 48h clear after Wed", load_week=True),
            week("Week 3", "Taper −30% gym sets · light Tue/Sat ball", taper=True),
            week("Week 4", "Match week · 10 Oct no gym · 11 Oct match", taper=True, match_week=True),
        ],
    }
    out = Path("/workspace/public/agent/setter-ultimate-template-v5.json")
    out.write_text(json.dumps(tpl, indent=2, ensure_ascii=False) + "\n")
    print(out, "bytes", out.stat().st_size)


if __name__ == "__main__":
    main()
