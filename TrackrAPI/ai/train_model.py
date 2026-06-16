import json
import os
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv
import pandas as pd
from xgboost import XGBRegressor
from joblib import dump
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

load_dotenv()

MONGO = os.getenv("MONGODB_URL", "mongodb://localhost:27017/trackrai")
OUTPUT = os.getenv("AI_MODEL_PATH", os.path.join(os.path.dirname(__file__), "model.joblib"))

FEATURES = [
    "distanceKm",
    "hrAvg",
    "stress",
    "durationMs",
    "steps"
]

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
    X = df[FEATURES]
    y = df["target"]

    model = XGBRegressor(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        objective="reg:squarederror"
    )

    validation_size = max(2, round(len(df) * 0.25))
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
        "samples": len(df),
        "trainingSamples": len(X_train),
        "validationSamples": len(X_validation),
        "metrics": metrics,
        "trainedAt": trained_at
    }, OUTPUT)

    print(json.dumps({
        "ok": True,
        "trained": True,
        "samples": len(df),
        "trainingSamples": len(X_train),
        "validationSamples": len(X_validation),
        "features": FEATURES,
        "metrics": metrics,
        "trainedAt": trained_at
    }))

if __name__ == "__main__":
    main()
