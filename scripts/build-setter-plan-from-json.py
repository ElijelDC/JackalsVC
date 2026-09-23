#!/usr/bin/env python3
"""Build embedded workout template v6 from setter-plan-2026-09-23.json."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN_JSON = ROOT / "public/agent/setter-plan-2026-09-23.json"
GUIDES = json.loads((Path(__file__).parent / "exercise-guide-urls.json").read_text())
OUT = ROOT / "public/agent/setter-template-v6.json"

DAY_LABEL = {
    "monday": "Mon",
    "tuesday": "Tue",
    "wednesday": "Wed",
    "thursday": "Thu",
    "friday": "Fri",
    "saturday": "Sat",
    "sunday": "Sun",
}

WEEK_THEMES = [
    ("Week 1", "23–28 Sep · full plan if body ≥6/10"),
    ("Week 2", "29 Sep–5 Oct · gym max 3 sets · Sat 3×3 jumps"),
    ("Week 3", "6–8 Oct · legs 2 sets · block 2×3 · light Sat"),
    ("Week 4", "Match peak · 10 Oct no gym · 11 Oct match"),
]


def lookup_guide(name: str, category: str) -> str:
    n = name.lower()
    for kw, url in GUIDES["keywords"]:
        if kw in n:
            return url
    return GUIDES["categoryFallback"].get(category, GUIDES["categoryFallback"]["strength"])


def parse_prescription(rx: str):
    rx = (rx or "1x1").strip()
    m = re.match(r"(\d+)\s*x\s*(.+)", rx, re.I)
    if m:
        return int(m.group(1)), m.group(2).strip()
    return 1, rx


def infer_category(name: str, tags: list[str]) -> str:
    n = name.lower()
    if any(t in tags for t in ("plyometric",)):
        return "plyo"
    if "cardio" in n or "bike" in n or "rower" in n or "ski erg" in n or "shuttle" in n:
        return "conditioning"
    if any(
        x in n
        for x in (
            "set",
            "volleyball",
            "shuffle",
            "target",
            "footwork",
            "club",
            "wall",
        )
    ):
        return "skill"
    if any(
        x in n
        for x in (
            "prehab",
            "er ",
            "rotation",
            "scap",
            "wrist",
            "finger",
            "balance",
            "terminal",
            "sit-to-stand",
            "bridge",
            "towel",
        )
    ):
        return "mobility"
    if "jump" in n:
        return "plyo"
    return "strength"


def cap_sets(sets: int, week_idx: int, is_gym: bool, is_legs: bool, name: str) -> int:
    n = name.lower()
    if week_idx == 0:
        return sets
    if week_idx == 1 and is_gym:
        return min(sets, 3)
    if week_idx == 2:
        if is_gym and is_legs:
            return min(sets, 2)
        if is_gym:
            return min(sets, 2)
        if "jump" in n or "approach" in n:
            return min(sets, 3)
        if "shuttle" in n:
            return min(sets, 3)
    if week_idx == 3:
        if "jump" in n or "approach" in n:
            return min(sets, 2)
    return sets


def prehab_exercises(plan: dict) -> list[dict]:
    out = []
    for block in plan["prehabDaily"]["blocks"]:
        for item in block["items"]:
            sets, reps = parse_prescription(item["prescription"])
            name = item["name"]
            out.append(
                {
                    "name": name,
                    "category": "mobility",
                    "sets": sets,
                    "reps": reps,
                    "load": "Light",
                    "restSec": 30,
                    "notes": f"Daily prehab · {block['name']}",
                    "guideUrl": lookup_guide(name, "mobility"),
                }
            )
    return out


def session_exercises(session: dict, week_idx: int, session_id: str) -> list[dict]:
    if not session.get("exercises"):
        return []
    tags = session.get("tags") or []
    is_gym = session_id.startswith(("mon-", "thu-", "fri-"))
    is_legs = "legs" in tags or session_id.startswith(("mon-", "fri-"))
    out = []
    for ex in session["exercises"]:
        sets, reps = parse_prescription(ex.get("prescription", "1x1"))
        cat = infer_category(ex["name"], tags)
        sets = cap_sets(sets, week_idx, is_gym, is_legs and session_id != "thu-flyefit-pull", ex["name"])
        rest = 90 if cat == "strength" else 60 if cat in ("plyo", "skill") else 45
        out.append(
            {
                "name": ex["name"],
                "category": cat,
                "sets": sets,
                "reps": reps,
                "load": "RPE 7" if cat == "strength" and week_idx < 2 else "Moderate",
                "restSec": rest,
                "notes": ex.get("notes", ""),
                "guideUrl": lookup_guide(ex["name"], cat),
            }
        )
    return out


def wednesday_day(week_idx: int, plan: dict) -> dict:
    sess = plan["sessions"]["wed-rest-club-optional"]
    notes = " · ".join(sess.get("notes") or [])
    exercises = [
        {
            "name": "Daily prehab (12 min) before club if attending",
            "category": "mobility",
            "sets": 1,
            "reps": "12 min",
            "load": "—",
            "restSec": 0,
            "notes": "No Flyefit · no home workout today",
            "guideUrl": lookup_guide("prehab", "mobility"),
        },
        {
            "name": "Optional club training 19:00–21:00",
            "category": "skill",
            "sets": 1,
            "reps": "2 h",
            "load": "Live",
            "restSec": 0,
            "notes": "Only if feeling ≥6/10 · no gym after",
            "guideUrl": lookup_guide("club volleyball", "skill"),
        },
    ]
    if week_idx == 3:
        exercises.append(
            {
                "name": "Match week — prefer full rest if fatigued",
                "category": "mobility",
                "sets": 1,
                "reps": "—",
                "load": "—",
                "restSec": 0,
                "notes": "Save legs for 11 Oct",
                "guideUrl": lookup_guide("prehab", "mobility"),
            }
        )
    return {
        "label": "Wed",
        "title": sess["title"],
        "focus": notes,
        "rest": True,
        "exercises": exercises,
    }


def sunday_day(week_idx: int, plan: dict) -> dict:
    sess = plan["sessions"]["sun-rest-prehab"]
    focus = " · ".join(sess.get("notes") or []) + " · track weekly metrics"
    exs = prehab_exercises(plan)
    if week_idx == 3:
        exs.append(
            {
                "name": "11 Oct — match day prep mindset",
                "category": "skill",
                "sets": 1,
                "reps": "—",
                "load": "—",
                "restSec": 0,
                "notes": "Prehab + venue warm-up on match day",
                "guideUrl": lookup_guide("prehab", "mobility"),
            }
        )
    return {
        "label": "Sun",
        "title": sess["title"],
        "focus": focus,
        "rest": True,
        "exercises": exs,
    }


def friday_day(week_idx: int, plan: dict) -> dict:
    if week_idx == 3:
        return {
            "label": "Fri",
            "title": "10 Oct — day before match",
            "focus": "No gym · prehab + 15 easy wall sets",
            "rest": True,
            "exercises": [
                {
                    "name": "12 min daily prehab",
                    "category": "mobility",
                    "sets": 1,
                    "reps": "12 min",
                    "load": "—",
                    "restSec": 0,
                    "notes": "No Flyefit",
                    "guideUrl": lookup_guide("prehab", "mobility"),
                },
                {
                    "name": "15 easy 1 kg wall sets (optional)",
                    "category": "skill",
                    "sets": 1,
                    "reps": "15",
                    "load": "Light",
                    "restSec": 0,
                    "notes": "Only if shoulders feel great",
                    "guideUrl": lookup_guide("wall sets", "skill"),
                },
            ],
        }
    sess = plan["sessions"]["fri-flyefit-leg-b-push"]
    exs = session_exercises(sess, week_idx, "fri-flyefit-leg-b-push")
    if week_idx == 1 and exs:
        for e in exs:
            if "bike" in e["name"].lower() or "ski" in e["name"].lower():
                e["reps"] = "8 min easy"
    return {
        "label": "Fri",
        "title": "Flyefit · Leg B + push",
        "focus": "8 items · legs + push · no jumping · prehab first",
        "rest": False,
        "exercises": exs,
    }


def thursday_day(week_idx: int, plan: dict) -> dict:
    if week_idx == 3:
        return {
            "label": "Thu",
            "title": "9 Oct — optional pull + core or rest",
            "focus": "20 min max or full rest",
            "rest": False,
            "exercises": [
                {
                    "name": "Face pull + Pallof (optional)",
                    "category": "strength",
                    "sets": 2,
                    "reps": "12 · 10/side",
                    "load": "Light",
                    "restSec": 60,
                    "notes": "Skip if tired",
                    "guideUrl": lookup_guide("face pull", "strength"),
                },
                {
                    "name": "Dead bug (optional)",
                    "category": "strength",
                    "sets": 2,
                    "reps": "8/side",
                    "load": "—",
                    "restSec": 45,
                    "notes": "Or take full rest",
                    "guideUrl": lookup_guide("dead bug", "strength"),
                },
            ],
        }
    sess = plan["sessions"]["thu-flyefit-pull"]
    return {
        "label": "Thu",
        "title": "Flyefit · pull only",
        "focus": "8 items · NO legs · prehab first",
        "rest": False,
        "exercises": session_exercises(sess, week_idx, "thu-flyefit-pull"),
    }


def build_week(week_idx: int, plan: dict) -> dict:
    name, theme = WEEK_THEMES[week_idx]
    days = []
    for row in plan["weeklySchedule"]:
        sid = row["sessionId"]
        if row["day"] == "wednesday":
            days.append(wednesday_day(week_idx, plan))
            continue
        if row["day"] == "sunday":
            days.append(sunday_day(week_idx, plan))
            continue
        if row["day"] == "friday":
            days.append(friday_day(week_idx, plan))
            continue
        if row["day"] == "thursday":
            days.append(thursday_day(week_idx, plan))
            continue
        sess = plan["sessions"][sid]
        exs = session_exercises(sess, week_idx, sid)
        if week_idx >= 1 and sid == "sat-home-jumps":
            for e in exs:
                if "approach" in e["name"].lower():
                    e["reps"] = "3" if week_idx >= 1 else e["reps"]
                    e["sets"] = 3 if week_idx == 1 else e["sets"]
        prehab_note = "12 min prehab before session"
        if row["day"] == "monday":
            title, focus = "Flyefit · Leg A + push", f"{prehab_note} · 8 items (min 6)"
        elif row["day"] == "tuesday":
            title, focus = "Home · hands & setting", f"{prehab_note} · 6 drills · no jumps"
        else:
            title, focus = "Home · jumps & sets", f"{prehab_note} · ≥48h after Fri legs"
        days.append(
            {
                "label": DAY_LABEL[row["day"]],
                "title": title,
                "focus": focus,
                "rest": False,
                "exercises": exs,
            }
        )
    return {"name": name, "theme": theme, "days": days}


def main():
    plan = json.loads(PLAN_JSON.read_text())
    meta = plan["meta"]
    tpl = {
        "planTemplateVersion": 6,
        "planSpecVersion": meta["version"],
        "title": meta["title"],
        "subtitle": f"VLY Div 2 · Match {meta['matchDate']} · Flyefit Mon/Thu/Fri",
        "prehabDaily": plan["prehabDaily"],
        "taperPhases": plan["taperPhases"],
        "trackingWeekly": plan["trackingWeekly"],
        "weeks": [build_week(i, plan) for i in range(4)],
    }
    OUT.write_text(json.dumps(tpl, indent=2, ensure_ascii=False) + "\n")
    print("wrote", OUT, OUT.stat().st_size)


if __name__ == "__main__":
    main()
