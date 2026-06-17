import numpy as np
from typing import Any, Dict, List

from analysis.metrics import angle, smooth, to_xy
from analysis.pose_extractor import extract_pose_frames

L_SHOULDER, R_SHOULDER = 11, 12
L_HIP, R_HIP = 23, 24
L_KNEE, R_KNEE = 25, 26


def _hip_angle(lm, w: int, h: int, side: str) -> float:
    if side == "left":
        shoulder = to_xy(lm[L_SHOULDER], w, h)
        hip = to_xy(lm[L_HIP], w, h)
        knee = to_xy(lm[L_KNEE], w, h)
    else:
        shoulder = to_xy(lm[R_SHOULDER], w, h)
        hip = to_xy(lm[R_HIP], w, h)
        knee = to_xy(lm[R_KNEE], w, h)
    return angle(shoulder, hip, knee)


def analyze_deadlift(video_path: str) -> Dict[str, Any]:
    """Experimental deadlift analysis based on hip extension."""
    frames = extract_pose_frames(
        video_path,
        sample_every_n=2,
        key_ids=[L_SHOULDER, R_SHOULDER, L_HIP, R_HIP, L_KNEE, R_KNEE],
    )

    left: List[float] = []
    right: List[float] = []
    valid = 0

    for pf in frames:
        if pf.landmarks is None:
            continue
        valid += 1
        lm = pf.landmarks.landmark
        left.append(_hip_angle(lm, pf.width, pf.height, "left"))
        right.append(_hip_angle(lm, pf.width, pf.height, "right"))

    if valid < 10:
        return {
            "ok": False,
            "score": 0,
            "errors": ["no_pose"],
            "tips": ["Cadre le corps entier de cote : epaules, hanches et genoux doivent rester visibles."],
            "metrics": {"validFrames": valid, "mode": "experimental"},
        }

    left = smooth(left, 7)
    right = smooth(right, 7)
    hip_avg = [(a + b) / 2.0 for a, b in zip(left, right)]

    reps = 0
    state = "UP"
    current_min = 999.0

    for ang in hip_avg:
        if state == "UP" and ang < 135:
            state = "DOWN"
            current_min = ang
        elif state == "DOWN":
            current_min = min(current_min, ang)
            if ang > 165:
                reps += 1
                state = "UP"
                current_min = 999.0

    min_hip = float(np.min(hip_avg))
    max_hip = float(np.max(hip_avg))
    lr_diff_mean = float(np.mean([abs(a - b) for a, b in zip(left, right)]))

    errors: List[str] = []
    tips: List[str] = ["Mode souleve de terre experimental : la camera doit rester stable et de cote."]

    if reps == 0:
        errors.append("no_repetition_detected")
        tips.append("Effectue un cycle complet depart bas, extension debout, retour bas.")

    if max_hip < 160:
        errors.append("lockout_incomplete")
        tips.append("Extension de hanche incomplete detectee : termine plus droit en haut du mouvement.")
    else:
        tips.append("Extension haute coherente.")

    if min_hip > 150:
        errors.append("range_of_motion_insufficient")
        tips.append("Amplitude faible detectee : le depart bas n'est pas clairement visible.")

    if lr_diff_mean > 15:
        errors.append("asymmetry_left_right")
        tips.append("Difference gauche/droite detectee : verifie ton placement face a la camera.")

    score = 100
    if "no_repetition_detected" in errors:
        score = 35
    else:
        if "range_of_motion_insufficient" in errors:
            score -= 25
        if "lockout_incomplete" in errors:
            score -= 25
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
            "minHipAngle": min_hip,
            "maxHipAngle": max_hip,
            "leftRightHipAngleDiffMean": lr_diff_mean,
            "validFrames": int(valid),
            "mode": "experimental",
        },
    }
