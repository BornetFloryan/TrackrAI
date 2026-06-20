import json
import os
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from joblib import dump
from pymongo import MongoClient
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit, train_test_split
from xgboost import XGBRegressor

load_dotenv()

MONGO = os.getenv("MONGODB_URL", "mongodb://localhost:27017/trackrai")
OUTPUT = os.getenv("AI_MODEL_PATH", os.path.join(os.path.dirname(__file__), "model.joblib"))
EXTERNAL_DATA_PATH = os.getenv(
    "AI_EXTERNAL_DATA_PATH",
    os.path.join(os.path.dirname(__file__), "external_training_data.csv"),
)
AUGMENTATION_FACTOR = int(os.getenv("AI_AUGMENTATION_FACTOR", "2"))
RANDOM_SEED = int(os.getenv("AI_RANDOM_SEED", "42"))
MIN_SAMPLES = int(os.getenv("AI_MIN_SAMPLES", "12"))
TARGET = "next_comparable_session_hr_avg"

FEATURES = [
    "distanceKm",
    "durationMin",
    "hrAvg",
    "hrMax",
    "stress",
    "steps",
    "paceStepsPerMin",
    "distanceVsHistory",
    "stepsVsHistory",
    "stressVsHistory",
    "hrVsHistory",
    "historyCount",
    "daysSincePrevious",
]


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
        "durationMin": duration_ms / 60000 if duration_ms > 0 else num(stats.get("durationMin")),
        "hrAvg": num(stats.get("hrAvg")),
        "hrMax": num(stats.get("hrMax")),
        "stress": num(stats.get("stress")),
        "steps": num(stats.get("steps")),
    }


def usable(stats):
    return (
        stats["durationMin"] >= 5
        and 40 <= stats["hrAvg"] <= 220
        and (stats["distanceKm"] >= 0.1 or stats["steps"] >= 100)
    )


def comparable(first, second):
    if not usable(first) or not usable(second):
        return False
    duration_ratio = second["durationMin"] / max(first["durationMin"], 1)
    if not 0.6 <= duration_ratio <= 1.67:
        return False
    if first["distanceKm"] >= 0.1 and second["distanceKm"] >= 0.1:
        load_ratio = second["distanceKm"] / first["distanceKm"]
    elif first["steps"] >= 100 and second["steps"] >= 100:
        load_ratio = second["steps"] / first["steps"]
    else:
        return False
    return 0.5 <= load_ratio <= 2.0


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


def local_rows(db):
    sessions = list(
        db.sessions.find(
            {
                "endDate": {"$exists": True},
                "stats.durationMs": {"$exists": True},
                "stats.hrAvg": {"$exists": True},
            }
        ).sort([("user", 1), ("startDate", 1)])
    )
    grouped = {}
    for session in sessions:
        grouped.setdefault(str(session.get("user")), []).append(session)

    rows = []
    for user_id, user_sessions in grouped.items():
        user_sessions.sort(key=lambda item: item.get("startDate") or datetime.min)
        for index, current in enumerate(user_sessions[:-1]):
            current_stats = session_stats(current)
            if not usable(current_stats):
                continue
            following = next(
                (
                    candidate
                    for candidate in user_sessions[index + 1 :]
                    if comparable(current_stats, session_stats(candidate))
                ),
                None,
            )
            if following is None:
                continue
            row = build_features(current, user_sessions[:index])
            row["nextHrAvg"] = session_stats(following)["hrAvg"]
            row["group"] = f"local:{user_id}"
            row["source"] = "TrackrAI"
            rows.append(row)
    return rows


def external_rows():
    if not os.path.exists(EXTERNAL_DATA_PATH):
        return []
    frame = pd.read_csv(EXTERNAL_DATA_PATH)
    if "nextHrAvg" not in frame.columns:
        return []

    rows = []
    for _, source_row in frame.iterrows():
        target = num(source_row.get("nextHrAvg"))
        if not 40 <= target <= 220:
            continue
        row = {feature: num(source_row.get(feature)) for feature in FEATURES}
        if row["durationMin"] < 0.75 or not 40 <= row["hrAvg"] <= 220:
            continue
        if row["distanceKm"] < 0.01 and row["steps"] < 10:
            continue
        subject = str(source_row.get("subject", "unknown"))
        source = str(source_row.get("source", "external"))
        row["nextHrAvg"] = target
        row["group"] = f"{source}:{subject}"
        row["source"] = source
        rows.append(row)
    return rows


def augment(frame):
    if AUGMENTATION_FACTOR <= 0 or frame.empty:
        return frame.copy()
    rng = np.random.default_rng(RANDOM_SEED)
    generated = [frame.copy()]
    for _ in range(AUGMENTATION_FACTOR):
        clone = frame.copy()
        for feature in FEATURES:
            values = clone[feature].astype(float)
            scale = max(float(values.std() or 0), 1.0)
            clone[feature] = values + rng.normal(0, scale * 0.025, len(clone))
        for feature in [
            "distanceKm",
            "durationMin",
            "hrAvg",
            "hrMax",
            "steps",
            "paceStepsPerMin",
            "historyCount",
            "daysSincePrevious",
        ]:
            clone[feature] = clone[feature].clip(lower=0)
        clone["stress"] = clone["stress"].clip(0, 100)
        generated.append(clone)
    return pd.concat(generated, ignore_index=True)


def split_raw(frame):
    groups = frame["group"].astype(str)
    if groups.nunique() >= 2:
        splitter = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=RANDOM_SEED)
        train_indices, validation_indices = next(splitter.split(frame, groups=groups))
        return frame.iloc[train_indices].copy(), frame.iloc[validation_indices].copy()
    return train_test_split(frame, test_size=max(2, round(len(frame) * 0.25)), random_state=RANDOM_SEED)


def main():
    db = MongoClient(MONGO).get_default_database()
    local = local_rows(db)
    external = external_rows()
    rows = local + external

    if len(rows) < MIN_SAMPLES:
        print(json.dumps({
            "ok": False,
            "reason": "not_enough_observed_pairs",
            "target": TARGET,
            "samples": len(rows),
            "localSamples": len(local),
            "externalSamples": len(external),
            "minimumSamples": MIN_SAMPLES,
        }))
        return

    raw = pd.DataFrame(rows)
    raw_train, validation = split_raw(raw)
    training = augment(raw_train)

    model = XGBRegressor(
        n_estimators=160,
        max_depth=3,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="reg:squarederror",
        random_state=RANDOM_SEED,
    )
    model.fit(training[FEATURES], training["nextHrAvg"])

    predictions = model.predict(validation[FEATURES])
    actual = validation["nextHrAvg"].to_numpy()
    baseline = validation["hrAvg"].to_numpy()
    mae = float(mean_absolute_error(actual, predictions))
    baseline_mae = float(mean_absolute_error(actual, baseline))
    metrics = {
        "maeBpm": round(mae, 3),
        "rmseBpm": round(float(mean_squared_error(actual, predictions) ** 0.5), 3),
        "r2": round(float(r2_score(actual, predictions)), 3) if len(validation) >= 2 else None,
        "baselineMaeBpm": round(baseline_mae, 3),
        "beatsBaseline": mae < baseline_mae,
        "improvementVsBaselinePct": round((baseline_mae - mae) / baseline_mae * 100, 1)
        if baseline_mae > 0
        else None,
    }
    trained_at = datetime.now(timezone.utc).isoformat()
    pack = {
        "model": model,
        "features": FEATURES,
        "target": TARGET,
        "targetDescription": "Frequence cardiaque moyenne observee lors de la prochaine seance comparable.",
        "targetUnit": "bpm",
        "samples": len(training) + len(validation),
        "rawSamples": len(raw),
        "localSamples": len(local),
        "externalSamples": len(external),
        "externalDataSource": "UCI PAMAP2 raw preprocessing",
        "trainingSamples": len(training),
        "rawTrainingSamples": len(raw_train),
        "validationSamples": len(validation),
        "augmentationFactor": AUGMENTATION_FACTOR,
        "syntheticAugmentation": AUGMENTATION_FACTOR > 0,
        "metrics": metrics,
        "trainedAt": trained_at,
    }
    dump(pack, OUTPUT)
    print(json.dumps({"ok": True, "trained": True, **{key: value for key, value in pack.items() if key != "model" and key != "features"}, "features": FEATURES}))


if __name__ == "__main__":
    main()
