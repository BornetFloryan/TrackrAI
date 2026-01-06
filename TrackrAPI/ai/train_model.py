import os, json
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from joblib import dump
from xgboost import XGBRegressor

load_dotenv()

MONGO = os.getenv("MONGODB_URL", "mongodb://mongo:27017/trackrapi")
MODEL_PATH = os.getenv("AI_MODEL_PATH", "/app/python/model.joblib")

FEATURES = ["durationMs", "distanceKm", "steps", "hrAvg", "hrMax", "stress", "rmssd"]

def main():
    client = MongoClient(MONGO)
    db = client.get_default_database()
    sessions = list(db["sessions"].find({"endDate": {"$exists": True}, "stats": {"$exists": True}}))

    rows = []
    for s in sessions:
        st = s.get("stats") or {}
        score = (st.get("score") or {}).get("global", None)
        if score is None:
            continue

        row = {f: st.get(f, None) for f in FEATURES}
        row["y"] = score
        rows.append(row)

    if len(rows) < 5:
        print(json.dumps({
            "ok": False,
            "message": "Pas assez de données pour entraîner (min 5 sessions finies avec stats.score.global).",
            "n": len(rows)
        }))
        return

    df = pd.DataFrame(rows).dropna()
    if len(df) < 5:
        print(json.dumps({
            "ok": False,
            "message": "Après nettoyage (NaN), pas assez de lignes.",
            "n": int(len(df))
        }))
        return

    X = df[FEATURES]
    y = df["y"]

    model = XGBRegressor(
        n_estimators=250,
        max_depth=4,
        learning_rate=0.06,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42
    )
    model.fit(X, y)

    dump({"model": model, "features": FEATURES}, MODEL_PATH)

    print(json.dumps({
        "ok": True,
        "message": "Modèle entraîné et sauvegardé",
        "modelPath": MODEL_PATH,
        "nTrain": int(len(df)),
        "features": FEATURES
    }))

if __name__ == "__main__":
    main()
