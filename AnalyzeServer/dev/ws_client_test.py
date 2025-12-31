import asyncio
import base64
import json
import sys
import os
import websockets

WS_URL = "ws://localhost:6000"
CHUNK_SIZE = 64 * 1024  # 64 KB


async def send_video(video_path: str):
    async with websockets.connect(WS_URL, max_size=None) as ws:
        print("[CLIENT] Connected")

        # recevoir ACK CONNECTED
        print("[SERVER]", await ws.recv())

        # START_ANALYSIS
        start_msg = {
            "type": "START_ANALYSIS",
            "exercise": "squat",
            "userId": "dev_user",
            "meta": {"env": "dev"}
        }
        await ws.send(json.dumps(start_msg))
        print("[SERVER]", await ws.recv())

        # envoyer la vidéo par chunks
        size = os.path.getsize(video_path)
        sent = 0

        with open(video_path, "rb") as f:
            while True:
                chunk = f.read(CHUNK_SIZE)
                if not chunk:
                    break

                b64 = base64.b64encode(chunk).decode("utf-8")
                await ws.send(json.dumps({
                    "type": "VIDEO_CHUNK",
                    "data": b64
                }))
                sent += len(chunk)

                # lire PROGRESS
                msg = await ws.recv()
                print("[SERVER]", msg)

        # END_ANALYSIS
        await ws.send(json.dumps({"type": "END_ANALYSIS"}))

        # recevoir ACK ANALYSIS_STARTED
        print("[SERVER]", await ws.recv())

        # recevoir RESULT
        result = await ws.recv()
        print("\n===== RESULT =====")
        print(json.dumps(json.loads(result), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python ws_client_test.py <video.mp4>")
        sys.exit(1)

    asyncio.run(send_video(sys.argv[1]))
