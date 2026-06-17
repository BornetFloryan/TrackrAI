import numpy as np
from typing import Any, Dict, List

from analysis.metrics import angle, smooth, to_xy
from analysis.pose_extractor import extract_pose_frames

L_SHOULDER, R_SHOULDER = 11, 12
L_ELBOW, R_ELBOW = 13, 14
L_WRIST, R_WRIST = 15, 16


def _elbow_angle(lm, w: int, h: int, side: str) -> float:
    if side == "left":
        shoulder = to_xy(lm[L_SHOULDER], w, h)
        elbow = to_xy(lm[L_ELBOW], w, h)
        wrist = to_xy(lm[L_WRIST], w, h)
    else:
        shoulder = to_xy(lm[R_SHOULDER], w, h)
        elbow = to_xy(lm[R_ELBOW], w, h)
        wrist = to_xy(lm[R_WRIST], w, h)
    return angle(shoulder, elbow, wrist)


def analyze_bench(video_path: str) -> Dict[str, Any]:
    """Experimental bench press analysis based on elbow angles."""
    frames = extract_pose_frames(
        video_path,
        sample_every_n=2,
        key_ids=[L_SHOULDER, R_SHOULDER, L_ELBOW, R_ELBOW, L_WRIST, R_WRIST],
    )

    left: List[float] = []
    right: List[float] = []
    valid = 0

    for pf in frames:
        if pf.landmarks is None:
            continue
        valid += 1
        lm = pf.landmarks.landmark
        left.append(_elbow_angle(lm, pf.width, pf.height, "left"))
        right.append(_elbow_angle(lm, pf.width, pf.height, "right"))

    if valid < 10:
        return {
            "ok": False,
            "score": 0,
            "errors": ["no_pose"],
            "tips": ["Cadre le haut du corps : epaules, coudes et poignets doivent rester visibles."],
            "metrics": {"validFrames": valid, "mode": "experimental"},
        }

    left = smooth(left, 7)
    right = smooth(right, 7)
    elbow_avg = [(a + b) / 2.0 for a, b in zip(left, right)]

    reps = 0
    state = "UP"
    current_min = 999.0

    for ang in elbow_avg:
        if state == "UP" and ang < 105:
            state = "DOWN"
            current_min = ang
        elif state == "DOWN":
            current_min = min(current_min, ang)
            if ang > 150:
                reps += 1
                state = "UP"
                current_min = 999.0

    min_elbow = float(np.min(elbow_avg))
    max_elbow = float(np.max(elbow_avg))
    lr_diff_mean = float(np.mean([abs(a - b) for a, b in zip(left, right)]))

    errors: List[str] = []
    tips: List[str] = ["Mode developpe couche experimental : a valider avec une camera stable de cote ou 3/4."]

    if reps == 0:
        errors.append("no_repetition_detected")
        tips.append("Effectue une descente puis une extension complete des bras, bien visible.")

    if min_elbow > 120:
        errors.append("range_of_motion_insufficient")
        tips.append("Amplitude faible detectee : descends davantage la barre si la technique le permet.")
    elif min_elbow > 95:
        errors.append("range_of_motion_borderline")
        tips.append("Amplitude correcte mais perfectible.")
    else:
        tips.append("Amplitude de descente coherente.")

    if max_elbow < 145:
        errors.append("lockout_incomplete")
        tips.append("Extension finale incomplete detectee : verrouille mieux les bras en fin de repetition.")

    if lr_diff_mean > 15:
        errors.append("asymmetry_left_right")
        tips.append("Difference gauche/droite detectee : garde une poussee plus symetrique.")

    score = 100
    if "no_repetition_detected" in errors:
        score = 35
    else:
        if "range_of_motion_insufficient" in errors:
            score -= 30
        if "range_of_motion_borderline" in errors:
            score -= 15
        if "lockout_incomplete" in errors:
            score -= 20
        if "asymmetry_left_right" in errors:
            score -= 10
        score += min(10, reps)
        score = max(0, min(100, score))

    return {
        "ok": True,
        "score": int(score),
        "errors": errors,
        "tips": tips,
        "metrics": {
            "repetitions": int(reps),
            "minElbowAngle": min_elbow,
            "maxElbowAngle": max_elbow,
            "leftRightElbowAngleDiffMean": lr_diff_mean,
            "validFrames": int(valid),
            "mode": "experimental",
        },
    }
