from typing import Any, Dict
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
    else:
        a = {
            "ok": False,
            "score": 0,
            "errors": ["exercise_not_supported"],
            "tips": [f"Exercice '{ex}' non supporté pour l’instant (à ajouter dans analyzer_registry.py)."],
            "metrics": {},
        }

    # payload final (pour mobile + central)
    return {
        "analysisId": analysis_id,
        "userId": user_id,
        "exercise": ex,
        "meta": meta or {},
        "analysis": a,  # contient score/errors/tips/metrics
    }
