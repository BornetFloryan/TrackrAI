# python
# File: send_video_client.py
# Client de test : envoie un fichier mp4 au serveur d'analyse (127.0.0.1:6000)

import socket
import sys
import os

HOST = "127.0.0.1"
PORT = 6000
PATH = sys.argv[1] if len(sys.argv) > 1 else "test.mp4"

if not os.path.exists(PATH):
    print("Fichier introuvable:", PATH)
    sys.exit(1)

size = os.path.getsize(PATH)
header = f"VIDEO {size}\n".encode()

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.connect((HOST, PORT))
    s.sendall(header)
    with open(PATH, "rb") as f:
        while True:
            chunk = f.read(4096)
            if not chunk:
                break
            s.sendall(chunk)
    # lire la réponse du serveur d'analyse
    resp = s.recv(1024)
    print("Réponse serveur analyse:", resp.decode(errors="ignore"))
