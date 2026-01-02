import base64
import json
import os
import socket
from datetime import datetime
from typing import Any, Dict

CENTRAL_HOST = os.getenv("CENTRAL_HOST", "localhost")
CENTRAL_PORT = int(os.getenv("CENTRAL_PORT", "9000"))
ANALYSIS_TYPE = os.getenv("ANALYSIS_TYPE", "SPORT")

def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii")

def send_analysis_to_central(analysis_id: str, payload: Dict[str, Any]) -> str:
    date_str = datetime.now().replace(microsecond=0).isoformat()

    json_bytes = json.dumps(
        payload,
        ensure_ascii=False,
        separators=(",", ":")
    ).encode("utf-8")

    value = f"{analysis_id}|{_b64url(json_bytes)}"

    line = f"STOREANALYSIS {ANALYSIS_TYPE} {date_str} {value}\n"

    print("[AnalyzeServer] -> Central:", line[:120], "...")

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((CENTRAL_HOST, CENTRAL_PORT))
        s.sendall(line.encode("utf-8"))
        return s.recv(1024).decode("utf-8", errors="ignore").strip()
