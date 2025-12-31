import numpy as np
from typing import Any, Dict, List

from analysis.pose_extractor import extract_pose_frames
from analysis.metrics import angle, to_xy, smooth

# MediaPipe pose landmarks indices
L_SHOULDER, R_SHOULDER = 11, 12
L_HIP, R_HIP = 23, 24
L_KNEE, R_KNEE = 25, 26
L_ANKLE, R_ANKLE = 27, 28


def _knee_angle(lm, w: int, h: int, side: str) -> float:
    if side == "left":
        hip = to_xy(lm[L_HIP], w, h)
        knee = to_xy(lm[L_KNEE], w, h)
        ankle = to_xy(lm[L_ANKLE], w, h)
    else:
        hip = to_xy(lm[R_HIP], w, h)
        knee = to_xy(lm[R_KNEE], w, h)
        ankle = to_xy(lm[R_ANKLE], w, h)
    return angle(hip, knee, ankle)

def _torso_angle(lm, w: int, h: int, side: str) -> float:
    """
    Shoulder-Hip-Knee angle: small => forward lean.
    """
    if side == "left":
        shoulder = to_xy(lm[L_SHOULDER], w, h)
        hip = to_xy(lm[L_HIP], w, h)
        knee = to_xy(lm[L_KNEE], w, h)
    else:
        shoulder = to_xy(lm[R_SHOULDER], w, h)
        hip = to_xy(lm[R_HIP], w, h)
        knee = to_xy(lm[R_KNEE], w, h)
    return angle(shoulder, hip, knee)

def analyze_squat(video_path: str) -> Dict[str, Any]:
    """
    Squat analysis (rule-based on pose landmarks):
      - Count reps by detecting down->up transitions in knee angle.
      - Evaluate depth via minimum knee angle.
      - Evaluate torso lean via minimum torso angle.
      - Evaluate symmetry via mean L/R knee angle difference.
    """
    frames = extract_pose_frames(video_path, sample_every_n=2)

    lk: List[float] = []
    rk: List[float] = []
    tl: List[float] = []
    tr: List[float] = []
    valid = 0

    for pf in frames:
        if pf.landmarks is None:
            continue
        valid += 1
        lm = pf.landmarks.landmark
        lk.append(_knee_angle(lm, pf.width, pf.height, "left"))
        rk.append(_knee_angle(lm, pf.width, pf.height, "right"))
        tl.append(_torso_angle(lm, pf.width, pf.height, "left"))
        tr.append(_torso_angle(lm, pf.width, pf.height, "right"))

    if valid < 10:
        return {
            "ok": False,
            "score": 0,
            "errors": ["no_pose"],
            "tips": ["Mets-toi entièrement dans le champ (corps entier visible) et améliore la lumière."],
            "metrics": {"validFrames": valid},
        }

    lk = smooth(lk, 7)
    rk = smooth(rk, 7)
    tl = smooth(tl, 7)
    tr = smooth(tr, 7)

    knee_avg = [(a + b) / 2.0 for a, b in zip(lk, rk)]
    torso_avg = [(a + b) / 2.0 for a, b in zip(tl, tr)]

    # thresholds (heuristics)
    DOWN_TH = 110.0
    UP_TH = 160.0
    GOOD_DEPTH_TH = 95.0

    reps = 0
    state = "UP"
    rep_mins: List[float] = []
    current_min = 999.0

    for ang in knee_avg:
        if state == "UP":
            if ang < DOWN_TH:
                state = "DOWN"
                current_min = ang
        else:  # DOWN
            current_min = min(current_min, ang)
            if ang > UP_TH:
                reps += 1
                rep_mins.append(current_min)
                state = "UP"
                current_min = 999.0

    min_knee = float(np.min(knee_avg))
    avg_rep_min = float(np.mean(rep_mins)) if rep_mins else min_knee

    torso_min = float(np.min(torso_avg))
    lr_diff_mean = float(np.mean([abs(a - b) for a, b in zip(lk, rk)]))

    errors: List[str] = []
    tips: List[str] = []

    # reps
    if reps == 0:
        errors.append("no_repetition_detected")
        tips.append("Fais un cycle complet descente → remontée, bien visible à la caméra.")

    # depth
    if min_knee > 120:
        errors.append("depth_insufficient")
        tips.append("Descends plus bas (vise les cuisses proches de l’horizontale).")
    elif min_knee > GOOD_DEPTH_TH:
        errors.append("depth_borderline")
        tips.append("Encore un peu plus bas pour un squat plus propre.")
    else:
        tips.append("Profondeur correcte.")

    # torso lean
    # shoulder-hip-knee too small => too much forward lean
    if torso_min < 120:
        errors.append("back_lean_excessive")
        tips.append("Garde le buste plus droit (gainage + regard droit devant).")
    else:
        tips.append("Buste plutôt stable.")

    # symmetry
    if lr_diff_mean > 10:
        errors.append("asymmetry_left_right")
        tips.append("Travaille la symétrie (genoux qui suivent la même trajectoire).")

    # score
    score = 100
    if "no_pose" in errors or "no_repetition_detected" in errors:
        score = 30
    else:
        if "depth_insufficient" in errors:
            score -= 30
        if "depth_borderline" in errors:
            score -= 15
        if "back_lean_excessive" in errors:
            score -= 20
        if "asymmetry_left_right" in errors:
            score -= 10

        score += min(10, reps)  # small bonus
        score = max(0, min(100, score))

    return {
        "ok": True,
        "score": int(score),
        "errors": errors,
        "tips": tips,
        "metrics": {
            "repetitions": int(reps),
            "minKneeAngle": float(min_knee),
            "avgRepMinKneeAngle": float(avg_rep_min),
            "torsoMinAngle": float(torso_min),
            "leftRightKneeAngleDiffMean": float(lr_diff_mean),
            "validFrames": int(valid),
        }
    }
