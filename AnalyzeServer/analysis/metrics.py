import numpy as np

def angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    """
    Angle ABC in degrees (b is the vertex).
    """
    ba = a - b
    bc = c - b
    denom = (np.linalg.norm(ba) * np.linalg.norm(bc)) + 1e-8
    cosv = float(np.dot(ba, bc) / denom)
    cosv = float(np.clip(cosv, -1.0, 1.0))
    return float(np.degrees(np.arccos(cosv)))

def to_xy(lm, w: int, h: int) -> np.ndarray:
    return np.array([lm.x * w, lm.y * h], dtype=np.float32)

def smooth(values, k: int = 7):
    if len(values) < k:
        return values
    out = []
    half = k // 2
    for i in range(len(values)):
        a = max(0, i - half)
        b = min(len(values), i + half + 1)
        out.append(float(np.mean(values[a:b])))
    return out
