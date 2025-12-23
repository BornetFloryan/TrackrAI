import socket
import json
import os

CENTRAL_HOST = os.getenv("CENTRAL_HOST", "localhost")
CENTRAL_PORT = int(os.getenv("CENTRAL_PORT", "9000"))

def send_results_to_central(results):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((CENTRAL_HOST, CENTRAL_PORT))
        payload = "POSTURE " + json.dumps(results) + "\n"
        s.sendall(payload.encode())
        print("[Java] Réponse :", s.recv(1024).decode())
