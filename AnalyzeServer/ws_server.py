import asyncio
import os
import traceback
from websockets.server import WebSocketServerProtocol
import websockets

from protocol.messages import (
    parse_message,
    make_ack,
    make_error,
    make_progress,
    make_result,
)
from protocol.errors import ERR_BAD_MESSAGE, ERR_INTERNAL
from io.video_receiver import VideoReceiveSession
from analysis.analyzer_registry import analyze_video_for_exercise
from central.central_tcp_client import send_analysis_to_central


MAX_VIDEO_BYTES_DEFAULT = 250 * 1024 * 1024  # 250 MB


async def handle_client(ws: WebSocketServerProtocol):
    """
    Protocol (client -> server):
      - START_ANALYSIS { exercise, userId?, meta? }
      - VIDEO_CHUNK { data: base64 }
      - END_ANALYSIS {}

    Protocol (server -> client):
      - ACK, PROGRESS, RESULT, ERROR
    """
    recv: VideoReceiveSession | None = None
    max_bytes = int(os.getenv("MAX_VIDEO_BYTES", str(MAX_VIDEO_BYTES_DEFAULT)))
    central_enabled = os.getenv("CENTRAL_ENABLED", "1") == "1"

    try:
        await ws.send(make_ack("CONNECTED", {"maxBytes": max_bytes}))

        async for raw in ws:
            msg = parse_message(raw)
            if msg is None:
                await ws.send(make_error(ERR_BAD_MESSAGE, "Invalid JSON message"))
                continue

            mtype = msg.get("type")
            if not isinstance(mtype, str):
                await ws.send(make_error(ERR_BAD_MESSAGE, "Missing field 'type'"))
                continue

            # ---- ping ----
            if mtype == "PING":
                await ws.send(make_ack("PONG", {}))
                continue

            # ---- start analysis ----
            if mtype == "START_ANALYSIS":
                # close previous if any
                if recv is not None:
                    recv.cleanup()
                    recv = None

                exercise = (msg.get("exercise") or "squat").lower()
                user_id = msg.get("userId") or "anonymous"
                meta = msg.get("meta") or {}

                recv = VideoReceiveSession(
                    exercise=exercise,
                    user_id=user_id,
                    max_bytes=max_bytes,
                    meta=meta,
                )

                await ws.send(make_ack("STARTED", {
                    "analysisId": recv.analysis_id,
                    "exercise": exercise
                }))
                continue

            # ---- chunk ----
            if mtype == "VIDEO_CHUNK":
                if recv is None:
                    await ws.send(make_error(ERR_BAD_MESSAGE, "No active analysis. Send START_ANALYSIS first."))
                    continue

                b64 = msg.get("data")
                if not isinstance(b64, str) or not b64:
                    await ws.send(make_error(ERR_BAD_MESSAGE, "VIDEO_CHUNK requires non-empty base64 'data'"))
                    continue

                try:
                    recv.append_base64_chunk(b64)
                except Exception as e:
                    await ws.send(make_error(ERR_BAD_MESSAGE, f"Chunk error: {e}"))
                    recv.cleanup()
                    recv = None
                    continue

                await ws.send(make_progress(recv.analysis_id, recv.bytes_received))
                continue

            # ---- end ----
            if mtype == "END_ANALYSIS":
                if recv is None:
                    await ws.send(make_error(ERR_BAD_MESSAGE, "No active analysis."))
                    continue

                try:
                    video_path = recv.finalize()
                except Exception as e:
                    await ws.send(make_error(ERR_BAD_MESSAGE, f"Finalize error: {e}"))
                    recv.cleanup()
                    recv = None
                    continue

                await ws.send(make_ack("ANALYSIS_STARTED", {"analysisId": recv.analysis_id, "exercise": recv.exercise}))

                # analyze
                try:
                    result = analyze_video_for_exercise(
                        exercise=recv.exercise,
                        video_path=video_path,
                        analysis_id=recv.analysis_id,
                        user_id=recv.user_id,
                        meta=recv.meta,
                    )
                except Exception:
                    traceback.print_exc()
                    await ws.send(make_error(ERR_INTERNAL, "Analysis failed"))
                    recv.cleanup()
                    recv = None
                    continue

                # send to client
                await ws.send(make_result(result))

                # forward to central
                if central_enabled:
                    try:
                        send_analysis_to_central(result)
                    except Exception as e:
                        # don't fail user flow
                        await ws.send(make_error("CENTRAL_FORWARD_FAILED", f"Central forward failed: {e}"))

                recv.cleanup()
                recv = None
                continue

            await ws.send(make_error(ERR_BAD_MESSAGE, f"Unknown message type '{mtype}'"))

    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception:
        traceback.print_exc()
        try:
            await ws.send(make_error(ERR_INTERNAL, "Internal server error"))
        except Exception:
            pass
    finally:
        if recv is not None:
            recv.cleanup()


async def _main(host: str, port: int):
    # max_size=None => allow big messages (we chunk anyway)
    async with websockets.serve(handle_client, host, port, max_size=None):
        print(f"[AnalyzeServer] WebSocket listening on {host}:{port}")
        await asyncio.Future()


def run_ws_server(host: str, port: int):
    asyncio.run(_main(host, port))
