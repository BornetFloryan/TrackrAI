import os
import sys
import json
import math
from datetime import datetime, timezone

from pymongo import MongoClient
from bson import ObjectId

MEASURE_TYPES = {
    "heart_rate",
    "rmssd",
    "gps_speed",
    "acc_x", "acc_y", "acc_z",
    "gyro_x", "gyro_y", "gyro_z",
}

def _env(name: str, default: str = "") -> str:
    v = os.getenv(name, default)
    return v if v is not None else default

def median(values):
    if not values:
        return None
    s = sorted(values)
    n = len(s)
    mid = n // 2
    if n % 2 == 1:
        return float(s[mid])
    return float((s[mid - 1] + s[mid]) / 2.0)

def mean(values):
    if not values:
        return None
    return float(sum(values) / len(values))

def parse_float_safe(x):
    try:
        return float(x)
    except Exception:
        return None

def iso(dt):
    if not dt:
        return None
    if isinstance(dt, str):
        return dt
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing sessionId"}))
        sys.exit(2)

    session_id = sys.argv[1]

    mongo_url = _env("MONGODB_URL", "http://trackr-api:4567/trackrapi")
    client = MongoClient(mongo_url)
    db = client.get_default_database()

    sessions = db["sessions"]
    measures = db["measures"]

    session = sessions.find_one({"sessionId": session_id})
    if not session:
        print(json.dumps({"error": "session not found", "sessionId": session_id}))
        sys.exit(3)

    ms = list(measures.find({"session": session["_id"], "type": {"$in": list(MEASURE_TYPES)}}).sort("date", 1))
    if not ms:
        result = {
            "sessionId": session_id,
            "summary": {
                "durationMin": 0,
                "avgHr": None,
                "maxHr": None,
                "timeHighIntensitySec": 0,
                "avgSpeedKph": None,
            },
            "alerts": [],
            "recommendation": {
                "nextSession": "light",
                "message": "Aucune mesure trouvée pour cette session.",
                "reasons": ["Pas de données disponibles"]
            }
        }
        print(json.dumps(result))
        return

    hr = []
    rmssd = []
    speed = []

    # pour alertes : spikes HR
    hr_times = []  # (ts, hr)

    for m in ms:
        t = m.get("type")
        v = parse_float_safe(m.get("value"))
        if v is None:
            continue
        dt = m.get("date")
        if t == "heart_rate":
            hr.append(v)
            hr_times.append((dt, v))
        elif t == "rmssd":
            rmssd.append(v)
        elif t == "gps_speed":
            speed.append(v)

    avg_hr = mean(hr)
    max_hr = max(hr) if hr else None
    avg_speed = mean(speed)

    # durée = startDate -> lastMeasureAt/endDate/dernière mesure
    start = session.get("startDate")
    end = session.get("endDate")

    # fallback : date dernière mesure
    last_dt = ms[-1].get("date")
    if not end:
        end = last_dt

    duration_sec = 0
    if start and end:
        duration_sec = max(0, int((end - start).total_seconds()))
    duration_min = round(duration_sec / 60.0, 2)

    # Temps intensité haute (simple): HR > 170
    time_hi = 0
    if hr_times:
        # approx : on prend le pas entre mesures successives
        for i in range(1, len(hr_times)):
            prev_t, prev_hr = hr_times[i - 1]
            cur_t, _ = hr_times[i]
            dt_s = int((cur_t - prev_t).total_seconds())
            if prev_hr >= 170:
                time_hi += max(0, min(dt_s, 60))


    alerts = []

    # Alerte 1 : spike HR (+25 bpm en moins de 30s)
    spike = None
    for i in range(1, len(hr_times)):
        t0, h0 = hr_times[i - 1]
        t1, h1 = hr_times[i]
        dt_s = (t1 - t0).total_seconds()
        if 1 <= dt_s <= 30 and (h1 - h0) >= 25:
            spike = {"deltaBpm": round(h1 - h0, 1), "dtSec": int(dt_s)}
            break
    if spike:
        alerts.append({
            "type": "hr_spike",
            "severity": "medium",
            "message": f"Montée rapide de la FC détectée (+{spike['deltaBpm']} bpm en {spike['dtSec']}s)."
        })

    # Alerte 2 : HR très haute + speed basse (incohérence simple)
    # Si maxHR >= 180 ET vitesse moyenne < 4 km/h => possible incohérence (arrêt + stress)
    if max_hr is not None and avg_speed is not None:
        if max_hr >= 180 and avg_speed < 4.0:
            alerts.append({
                "type": "hr_effort_mismatch",
                "severity": "high",
                "message": "FC très élevée alors que la vitesse moyenne est faible (possible incohérence effort)."
            })

    # RMSSD fatigue 
    med_rmssd = median(rmssd)
    fatigue = "low"
    if med_rmssd is not None:
        if med_rmssd < 20:
            fatigue = "high"
        elif med_rmssd < 28:
            fatigue = "medium"

    next_session = "normal"
    reasons = []

    if any(a["severity"] == "high" for a in alerts):
        next_session = "light"
        reasons.append("Alerte cardio détectée")
    if time_hi >= 8 * 60:
        next_session = "light"
        reasons.append("Temps important en intensité élevée")
    if fatigue == "high":
        next_session = "light"
        reasons.append("RMSSD bas (fatigue probable)")
    if not reasons:
        reasons.append("Aucun signal de surcharge détecté")

    message_map = {
        "light": "Séance légère recommandée : 20–30 min à intensité faible (aisance respiratoire).",
        "normal": "Séance normale : 30–45 min avec progression douce.",
    }

    result = {
        "sessionId": session_id,
        "summary": {
            "startDate": iso(start),
            "endDate": iso(end),
            "durationMin": duration_min,
            "avgHr": None if avg_hr is None else int(round(avg_hr)),
            "maxHr": None if max_hr is None else int(round(max_hr)),
            "timeHighIntensitySec": int(time_hi),
            "avgSpeedKph": None if avg_speed is None else round(avg_speed, 2),
            "medianRmssd": None if med_rmssd is None else round(med_rmssd, 2),
        },
        "alerts": alerts,
        "recommendation": {
            "nextSession": next_session,
            "message": message_map.get(next_session, "Séance recommandée."),
            "reasons": reasons
        }
    }

    print(json.dumps(result))

if __name__ == "__main__":
    main()
