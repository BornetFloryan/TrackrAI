import socket
import json

CENTRAL_HOST = "192.168.1.xx"
CENTRAL_PORT = 5000

def send_results_to_central(results):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((CENTRAL_HOST, CENTRAL_PORT))
        payload = "POSTURE " + json.dumps(results) + "\n"
        s.sendall(payload.encode())
        print("[Java] Réponse :", s.recv(1024).decode())
