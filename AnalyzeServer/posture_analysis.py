import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose

def angle(a, b, c):
    ba = a - b
    bc = c - b
    cos = np.dot(ba, bc) / (np.linalg.norm(ba)*np.linalg.norm(bc)+1e-8)
    return float(np.degrees(np.arccos(np.clip(cos, -1, 1))))

def analyze_video(video_path):
    cap = cv2.VideoCapture(video_path)
    pose = mp_pose.Pose()
    angles = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = pose.process(rgb)

        if res.pose_landmarks:
            h, w, _ = frame.shape
            lm = res.pose_landmarks.landmark

            hip = np.array([lm[24].x*w, lm[24].y*h])
            knee = np.array([lm[26].x*w, lm[26].y*h])
            ankle = np.array([lm[28].x*w, lm[28].y*h])

            angles.append(angle(hip, knee, ankle))

    cap.release()

    if len(angles) == 0:
        return {"error": "no_pose"}

    return {
        "angle_min": float(np.min(angles)),
        "angle_max": float(np.max(angles)),
        "score": 100 if np.min(angles) < 90 else 60
    }
