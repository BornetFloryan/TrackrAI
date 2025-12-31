import os
from ws_server import run_ws_server

if __name__ == "__main__":
    host = os.getenv("WS_HOST", "0.0.0.0")
    port = int(os.getenv("WS_PORT", "6000"))
    print(f"[AnalyzeServer] Starting WebSocket on {host}:{port}")
    run_ws_server(host, port)
