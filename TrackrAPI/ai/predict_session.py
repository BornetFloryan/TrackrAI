import os, sys, json
from pymongo import MongoClient
from dotenv import load_dotenv
from joblib import load
import pandas as pd

load_dotenv()

MONGO = os.getenv("MONGODB_URL", "mongodb://localhost:27017/trackrai")
MODEL_PATH = os.getenv("AI_MODEL_PATH", os.path.join(os.path.dirname(__file__), "model.joblib"))

def clamp(x, a, b):
    return max(a, min(b, x))

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "reason": "missing_session_id"}))
        return

    if not os.path.exists(MODEL_PATH):
        print(json.dumps({"ok": False, "reason": "model_not_trained"}))
        return

    session_id = sys.argv[1]
    db = MongoClient(MONGO).get_default_database()
    s = db.sessions.find_one({"sessionId": session_id})

    if not s:
        print(json.dumps({"ok": False, "reason": "session_not_found"}))
        return

    st = s.get("stats", {})
    baseline = st.get("score", {})

    pack = load(MODEL_PATH)
    model = pack["model"]
    features = pack["features"]

    x = {f: st.get(f, 0) for f in features}
    df = pd.DataFrame([x])

    pred = clamp(float(model.predict(df)[0]), 0, 100)

    print(json.dumps({
        "ok": True,
        "global": round(pred, 1),
        "confidence": 0.6,
        "explain": {
            "baselineGlobal": baseline.get("global"),
            "features": x
        },
        "model": {
            "samples": pack.get("samples"),
            "rawSamples": pack.get("rawSamples"),
            "augmentedSamples": pack.get("augmentedSamples"),
            "syntheticAugmentation": pack.get("syntheticAugmentation"),
            "validationSamples": pack.get("validationSamples"),
            "metrics": pack.get("metrics"),
            "trainedAt": pack.get("trainedAt")
        }
    }))


if __name__ == "__main__":
    main()
