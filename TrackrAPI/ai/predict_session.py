import os, sys, json
from pymongo import MongoClient
from dotenv import load_dotenv
from joblib import load
import numpy as np
import pandas as pd

load_dotenv()

MONGO = os.getenv("MONGODB_URL", "mongodb://mongo:27017/trackrapi")
MODEL_PATH = os.getenv("AI_MODEL_PATH", "/app/python/model.joblib")

def clamp(x, a, b):
    return max(a, min(b, x))

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "missing sessionId"}))
        sys.exit(2)

    session_id = sys.argv[1]

    client = MongoClient(MONGO)
    db = client.get_default_database()
    s = db["sessions"].find_one({"sessionId": session_id})

    if not s:
        print(json.dumps({"ok": False, "error": "session not found", "sessionId": session_id}))
        sys.exit(3)

    st = s.get("stats") or {}
    if not st:
        print(json.dumps({"ok": False, "error": "stats missing"}))
        sys.exit(4)

    pack = load(MODEL_PATH)
    model = pack["model"]
    features = pack["features"]

    x = {f: st.get(f, None) for f in features}
    df = pd.DataFrame([x]).fillna(0)

    pred = float(model.predict(df)[0])
    pred = clamp(pred, 0, 100)

    explain = {
        "predictedGlobal": round(pred, 1),
        "inputs": x,
        "note": "Prédiction XGBoost entraînée sur score baseline."
    }

    aiScore = {
        "global": round(pred, 1),
        "confidence": 0.6,
        "model": "xgboost-regressor",
        "version": "v1"
    }

    print(json.dumps({
        "ok": True,
        "sessionId": session_id,
        "aiScore": aiScore,
        "explain": explain
    }))

if __name__ == "__main__":
    main()
