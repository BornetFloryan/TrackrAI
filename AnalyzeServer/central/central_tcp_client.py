import base64
import json
import os
import socket
from datetime import datetime
from typing import Any, Dict

CENTRAL_HOST = os.getenv("CENTRAL_HOST", "localhost")
CENTRAL_PORT = int(os.getenv("CENTRAL_PORT", "9000"))

ANALYSIS_TYPE = os.getenv("ANALYSIS_TYPE", "SPORT")  # category for Mongo "type"


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii")


def send_analysis_to_central(payload: Dict[str, Any]) -> str:
    """
    Send: STOREANALYSIS <type> <date> <value>
      - <type> = ANALYSIS_TYPE (default SPORT)
      - <date> = LocalDateTime ISO string (parsable by LocalDateTime.parse)
      - <value> = base64url(json) to keep it a single token
    """
    date_str = datetime.now().replace(microsecond=0).isoformat()  # e.g. 2025-12-31T14:25:00

    json_bytes = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    value = _b64url(json_bytes)

    line = f"STOREANALYSIS {ANALYSIS_TYPE} {date_str} {value}\n"

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((CENTRAL_HOST, CENTRAL_PORT))
        s.sendall(line.encode("utf-8"))
        resp = s.recv(1024).decode("utf-8", errors="ignore").strip()
        return resp
