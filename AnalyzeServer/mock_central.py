# python
# File: mock_central.py
# Serveur central factice pour tests locaux (écoute sur 127.0.0.1:5000)

import socket

HOST = "127.0.0.1"
PORT = 5000

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind((HOST, PORT))
    s.listen(1)
    print(f"[Mock central] prêt sur {HOST}:{PORT}")
    conn, addr = s.accept()
    with conn:
        print("[Mock central] connexion de", addr)
        data = conn.recv(4096)
        print("[Mock central] reçu:", data.decode(errors="ignore"))
        # répondre comme le serveur Java attendu
        conn.sendall(b"OK_CENTRAL\n")
        print("[Mock central] réponse envoyée")
