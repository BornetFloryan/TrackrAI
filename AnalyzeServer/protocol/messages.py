import json
from typing import Any, Dict, Optional

def parse_message(raw: Any) -> Optional[Dict[str, Any]]:
    try:
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8", errors="ignore")
        if not isinstance(raw, str):
            return None
        obj = json.loads(raw)
        return obj if isinstance(obj, dict) else None
    except Exception:
        return None

def _dumps(obj: Dict[str, Any]) -> str:
    return json.dumps(obj, ensure_ascii=False)

def make_ack(kind: str, data: Dict[str, Any]) -> str:
    return _dumps({"type": "ACK", "kind": kind, "data": data})

def make_progress(analysis_id: str, bytes_received: int) -> str:
    return _dumps({"type": "PROGRESS", "analysisId": analysis_id, "bytesReceived": bytes_received})

def make_result(result: Dict[str, Any]) -> str:
    return _dumps({"type": "RESULT", "data": result})

def make_error(code: str, message: str) -> str:
    return _dumps({"type": "ERROR", "code": code, "message": message})
