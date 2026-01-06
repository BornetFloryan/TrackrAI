import os
from pymongo import MongoClient
from dotenv import load_dotenv
import pandas as pd
from xgboost import XGBRegressor
from joblib import dump

load_dotenv()

MONGO = os.getenv("MONGODB_URL", "mongodb://mongo:27017/trackrapi")
OUTPUT = os.getenv("AI_MODEL_PATH", "/app/ai/model.joblib")

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
        print("Not enough data to train model")
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

    model.fit(X, y)

    dump({
        "model": model,
        "features": FEATURES,
        "samples": len(df)
    }, OUTPUT)

    print(f"[AI] Model trained ({len(df)} samples)")

if __name__ == "__main__":
    main()
