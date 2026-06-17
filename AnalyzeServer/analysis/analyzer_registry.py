from typing import Any, Dict
from analysis.bench_analyzer import analyze_bench
from analysis.deadlift_analyzer import analyze_deadlift
from analysis.squat_analyzer import analyze_squat

def analyze_video_for_exercise(
    exercise: str,
    video_path: str,
    analysis_id: str,
    user_id: str,
    meta: Dict[str, Any],
) -> Dict[str, Any]:
    ex = (exercise or "squat").lower()

    if ex == "squat":
        a = analyze_squat(video_path)
    elif ex in ("bench", "bench_press", "developpe_couche", "developpe couche"):
        ex = "bench"
        a = analyze_bench(video_path)
    elif ex in ("deadlift", "souleve_de_terre", "souleve de terre"):
        ex = "deadlift"
        a = analyze_deadlift(video_path)
    else:
        a = {
            "ok": False,
            "score": 0,
            "errors": ["exercise_not_supported"],
            "tips": [f"Exercice '{ex}' non supporté pour l’instant (à ajouter dans analyzer_registry.py)."],
            "metrics": {},
        }

    return {
        "analysisId": analysis_id,
        "userId": user_id,
        "exercise": ex,
        "meta": meta or {},
        "analysis": a,  # contient score/errors/tips/metrics
    }
