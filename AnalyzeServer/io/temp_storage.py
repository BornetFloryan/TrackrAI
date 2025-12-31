import os
import tempfile

def make_temp_mp4(prefix: str) -> str:
    tmp = tempfile.NamedTemporaryFile(delete=False, prefix=prefix, suffix=".mp4")
    tmp.close()
    return tmp.name

def safe_remove(path: str):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception:
        pass
