import json
import os
import sys

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from joblib import load
from pymongo import MongoClient

load_dotenv()

MONGO = os.getenv("MONGODB_URL", "mongodb://localhost:27017/trackrai")
MODEL_PATH = os.getenv("AI_MODEL_PATH", os.path.join(os.path.dirname(__file__), "model.joblib"))


def num(value, default=0.0):
    try:
        value = float(value)
        return value if np.isfinite(value) else default
    except (TypeError, ValueError):
        return default


def pct_delta(new, old, floor=1.0):
    denominator = max(abs(num(old)), floor)
    return (num(new) - num(old)) / denominator


def session_stats(session):
    stats = session.get("stats") or {}
    duration_ms = num(stats.get("durationMs"))
    return {
        "distanceKm": num(stats.get("distanceKm")),
        "durationMin": duration_ms / 60000 if duration_ms > 0 else 0,
        "hrAvg": num(stats.get("hrAvg")),
        "hrMax": num(stats.get("hrMax")),
        "stress": num(stats.get("stress")),
        "steps": num(stats.get("steps")),
    }


def average(values):
    values = [num(value) for value in values]
    return sum(values) / len(values) if values else 0


def build_features(current, previous_sessions):
    stats = session_stats(current)
    previous_stats = [session_stats(session) for session in previous_sessions]
    distance_avg = average([item["distanceKm"] for item in previous_stats]) or stats["distanceKm"]
    steps_avg = average([item["steps"] for item in previous_stats]) or stats["steps"]
    stress_avg = average([item["stress"] for item in previous_stats]) or stats["stress"]
    hr_avg = average([item["hrAvg"] for item in previous_stats]) or stats["hrAvg"]

    days_since_previous = 0
    if previous_sessions and current.get("startDate") and previous_sessions[-1].get("startDate"):
        delta = current["startDate"] - previous_sessions[-1]["startDate"]
        days_since_previous = max(0, delta.total_seconds() / 86400)

    return {
        "distanceKm": stats["distanceKm"],
        "durationMin": stats["durationMin"],
        "hrAvg": stats["hrAvg"],
        "hrMax": stats["hrMax"],
        "stress": stats["stress"],
        "steps": stats["steps"],
        "paceStepsPerMin": stats["steps"] / max(stats["durationMin"], 1),
        "distanceVsHistory": pct_delta(stats["distanceKm"], distance_avg, 0.1),
        "stepsVsHistory": pct_delta(stats["steps"], steps_avg, 100),
        "stressVsHistory": stats["stress"] - stress_avg,
        "hrVsHistory": stats["hrAvg"] - hr_avg,
        "historyCount": len(previous_sessions),
        "daysSincePrevious": days_since_previous,
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "reason": "missing_session_id"}))
        return
    if not os.path.exists(MODEL_PATH):
        print(json.dumps({"ok": False, "reason": "model_not_trained"}))
        return

    db = MongoClient(MONGO).get_default_database()
    session = db.sessions.find_one({"sessionId": sys.argv[1]})
    if not session:
        print(json.dumps({"ok": False, "reason": "session_not_found"}))
        return

    stats = session_stats(session)
    quality_reasons = []
    if stats["durationMin"] < 5:
        quality_reasons.append("session_too_short")
    if stats["distanceKm"] < 0.1 and stats["steps"] < 100:
        quality_reasons.append("insufficient_load_data")
    if not 40 <= stats["hrAvg"] <= 220:
        quality_reasons.append("missing_heart_rate")
    if quality_reasons:
        print(json.dumps({
            "ok": False,
            "reason": "insufficient_session_quality",
            "qualityReasons": quality_reasons,
            "minimums": {"durationMin": 5, "distanceKm": 0.1, "steps": 100},
        }))
        return

    previous = list(
        db.sessions.find({
            "user": session.get("user"),
            "startDate": {"$lt": session.get("startDate")},
            "endDate": {"$exists": True},
        }).sort("startDate", 1)
    )
    pack = load(MODEL_PATH)
    if pack.get("target") != "next_comparable_session_hr_avg":
        print(json.dumps({"ok": False, "reason": "obsolete_model"}))
        return

    features = build_features(session, previous)
    frame = pd.DataFrame([{name: features.get(name, 0) for name in pack["features"]}])
    predicted_hr = float(np.clip(pack["model"].predict(frame)[0], 40, 220))
    metrics = pack.get("metrics") or {}
    mae = metrics.get("maeBpm")
    error_band = round(float(mae), 1) if isinstance(mae, (int, float)) else None

    print(json.dumps({
        "ok": True,
        "predictedNextHrAvg": round(predicted_hr, 1),
        "currentHrAvg": round(stats["hrAvg"], 1),
        "deltaBpm": round(predicted_hr - stats["hrAvg"], 1),
        "expectedRange": {
            "min": round(max(40, predicted_hr - error_band), 1),
            "max": round(min(220, predicted_hr + error_band), 1),
            "basis": "validation_mae",
        } if error_band is not None else None,
        "target": pack.get("target"),
        "unit": "bpm",
        "explain": {
            "meaning": "Frequence cardiaque moyenne prevue pour la prochaine seance de charge comparable.",
            "features": features,
        },
        "model": {
            "target": pack.get("target"),
            "targetDescription": pack.get("targetDescription"),
            "rawSamples": pack.get("rawSamples"),
            "localSamples": pack.get("localSamples"),
            "externalSamples": pack.get("externalSamples"),
            "externalDataSource": pack.get("externalDataSource"),
            "validationSamples": pack.get("validationSamples"),
            "metrics": metrics,
            "trainedAt": pack.get("trainedAt"),
        },
    }))


if __name__ == "__main__":
    main()
