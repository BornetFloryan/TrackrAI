import json
import os
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from joblib import dump
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

load_dotenv()

MONGO = os.getenv("MONGODB_URL", "mongodb://localhost:27017/trackrai")
OUTPUT = os.getenv("AI_MODEL_PATH", os.path.join(os.path.dirname(__file__), "model.joblib"))
AUGMENTATION_FACTOR = int(os.getenv("AI_AUGMENTATION_FACTOR", "6"))
RANDOM_SEED = int(os.getenv("AI_RANDOM_SEED", "42"))

FEATURES = [
    "distanceKm",
    "hrAvg",
    "stress",
    "durationMs",
    "steps"
]

def clamp(value, lower=0, upper=100):
    return max(lower, min(upper, value))

def augment_training_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Synthetic jitter around real sessions.
    This improves demo robustness with a tiny dataset, but does not replace real athlete data.
    """
    if AUGMENTATION_FACTOR <= 0 or df.empty:
        return df.copy()

    rng = np.random.default_rng(RANDOM_SEED)
    rows = [df]
    numeric_features = FEATURES + ["target"]

    for _ in range(AUGMENTATION_FACTOR):
        clone = df.copy()
        for feature in numeric_features:
            values = clone[feature].astype(float)
            scale = max(float(values.std() or 0), 1.0)
            noise = rng.normal(0, scale * 0.04, len(clone))
            clone[feature] = values + noise

        clone["distanceKm"] = clone["distanceKm"].clip(lower=0)
        clone["durationMs"] = clone["durationMs"].clip(lower=0)
        clone["steps"] = clone["steps"].clip(lower=0)
        clone["hrAvg"] = clone["hrAvg"].clip(lower=0)
        clone["stress"] = clone["stress"].clip(lower=0, upper=100)
        clone["target"] = clone["target"].map(lambda value: clamp(value))
        rows.append(clone)

    return pd.concat(rows, ignore_index=True)

def main():
    client = MongoClient(MONGO)
    db = client.get_default_database()

    sessions = list(db.sessions.find({
        "stats.score.global": {"$exists": True}
    }))

    if len(sessions) < 10:
        print(json.dumps({
            "ok": False,
            "reason": "not_enough_data",
            "samples": len(sessions),
            "minimumSamples": 10
        }))
        return

    rows = []

    for s in sessions:
        st = s.get("stats", {})
        score = st.get("score", {}).get("global")
        if score is None:
            continue

        rows.append({
            "distanceKm": st.get("distanceKm", 0),
            "hrAvg": st.get("hrAvg", 0),
            "stress": st.get("stress", 0),
            "durationMs": st.get("durationMs", 0),
            "steps": st.get("steps", 0),
            "target": score
        })

    df = pd.DataFrame(rows)
    if len(df) < 10:
        print(json.dumps({
            "ok": False,
            "reason": "not_enough_scored_rows",
            "samples": len(df),
            "minimumSamples": 10
        }))
        return

    raw_samples = len(df)
    training_df = augment_training_data(df)
    X = training_df[FEATURES]
    y = training_df["target"]

    model = XGBRegressor(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        objective="reg:squarederror"
    )

    validation_size = max(2, round(len(training_df) * 0.25))
    X_train, X_validation, y_train, y_validation = train_test_split(
        X,
        y,
        test_size=validation_size,
        random_state=42
    )

    model.fit(X_train, y_train)
    predictions = model.predict(X_validation)
    metrics = {
        "mae": round(float(mean_absolute_error(y_validation, predictions)), 3),
        "rmse": round(float(mean_squared_error(y_validation, predictions) ** 0.5), 3),
        "r2": round(float(r2_score(y_validation, predictions)), 3)
        if len(y_validation) >= 2 else None
    }
    trained_at = datetime.now(timezone.utc).isoformat()

    dump({
        "model": model,
        "features": FEATURES,
        "samples": len(training_df),
        "rawSamples": raw_samples,
        "augmentedSamples": len(training_df) - raw_samples,
        "augmentationFactor": AUGMENTATION_FACTOR,
        "syntheticAugmentation": AUGMENTATION_FACTOR > 0,
        "trainingSamples": len(X_train),
        "validationSamples": len(X_validation),
        "metrics": metrics,
        "trainedAt": trained_at
    }, OUTPUT)

    print(json.dumps({
        "ok": True,
        "trained": True,
        "samples": len(training_df),
        "rawSamples": raw_samples,
        "augmentedSamples": len(training_df) - raw_samples,
        "augmentationFactor": AUGMENTATION_FACTOR,
        "syntheticAugmentation": AUGMENTATION_FACTOR > 0,
        "trainingSamples": len(X_train),
        "validationSamples": len(X_validation),
        "features": FEATURES,
        "metrics": metrics,
        "trainedAt": trained_at
    }))

if __name__ == "__main__":
    main()
