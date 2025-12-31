import base64
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

from stream_io.temp_storage import make_temp_mp4, safe_remove


@dataclass
class VideoReceiveSession:
    exercise: str
    user_id: str
    max_bytes: int
    meta: Dict[str, Any]

    def __post_init__(self):
        self.analysis_id = f"a_{int(time.time() * 1000)}"
        self.path = make_temp_mp4(prefix=f"{self.exercise}_{self.analysis_id}_")
        self.f = open(self.path, "wb")
        self.bytes_received = 0
        self._finalized = False

    def append_base64_chunk(self, b64: str):
        if self._finalized:
            raise RuntimeError("Already finalized")
        data = base64.b64decode(b64.encode("utf-8"), validate=False)
        self.bytes_received += len(data)
        if self.bytes_received > self.max_bytes:
            raise RuntimeError(f"Video too large ({self.bytes_received} > {self.max_bytes})")
        self.f.write(data)

    def finalize(self) -> str:
        if self._finalized:
            return self.path
        self.f.flush()
        self.f.close()
        self._finalized = True
        return self.path

    def cleanup(self):
        try:
            try:
                if not self.f.closed:
                    self.f.close()
            except Exception:
                pass
        finally:
            safe_remove(self.path)
