import os, sys, json
from pymongo import MongoClient
from dotenv import load_dotenv
from joblib import load
import pandas as pd

load_dotenv()

MONGO = os.getenv("MONGODB_URL", "mongodb://mongo:27017/trackrapi")
MODEL_PATH = os.getenv("AI_MODEL_PATH", "/app/ai/model.joblib")

def clamp(x, a, b):
    return max(a, min(b, x))

def main():
    if len(sys.argv) < 2:
        sys.exit(0)

    if not os.path.exists(MODEL_PATH):
        print(json.dumps({"ok": False, "reason": "model_not_trained"}))
        return

    session_id = sys.argv[1]
    db = MongoClient(MONGO).get_default_database()
    s = db.sessions.find_one({"sessionId": session_id})

    if not s:
        return

    st = s.get("stats", {})
    baseline = st.get("score", {})
    components = baseline.get("components", {})

    pack = load(MODEL_PATH)
    model = pack["model"]
    features = pack["features"]

    x = {f: st.get(f, 0) for f in features}
    df = pd.DataFrame([x])

    pred = clamp(float(model.predict(df)[0]), 0, 100)

    print(json.dumps({
        "ok": True,
        "global": round(pred, 1)
    }))


if __name__ == "__main__":
    main()
