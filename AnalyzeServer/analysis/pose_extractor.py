import cv2
import mediapipe as mp
from dataclasses import dataclass
from typing import List, Optional

mp_pose = mp.solutions.pose

@dataclass
class PoseFrame:
    width: int
    height: int
    landmarks: Optional[object]  # mediapipe pose landmarks

def extract_pose_frames(
    video_path: str,
    sample_every_n: int = 2,
    min_visibility: float = 0.4
) -> List[PoseFrame]:
    """
    Extract pose landmarks from a video. Samples 1 frame every N frames for speed.
    """
    cap = cv2.VideoCapture(video_path)
    pose = mp_pose.Pose(model_complexity=1, enable_segmentation=False)

    frames: List[PoseFrame] = []
    idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        idx += 1
        if sample_every_n > 1 and (idx % sample_every_n != 0):
            continue

        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = pose.process(rgb)

        if res.pose_landmarks:
            lm = res.pose_landmarks.landmark
            # quick visibility check on hips/knees/ankles
            key_ids = [23, 24, 25, 26, 27, 28]
            if any(lm[i].visibility >= min_visibility for i in key_ids):
                frames.append(PoseFrame(w, h, res.pose_landmarks))
            else:
                frames.append(PoseFrame(w, h, None))
        else:
            frames.append(PoseFrame(w, h, None))

    cap.release()
    return frames
