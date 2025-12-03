import socket
import threading
from video_handler import receive_video
from posture_analysis import analyze_video
from central_tcp_client import send_results_to_central

HOST = "0.0.0.0"
PORT = 6000

def handle_client(conn, addr):
    print(f"[+] Connexion Android depuis {addr}")

    try:
        video_path = receive_video(conn)

        results = analyze_video(video_path)

        send_results_to_central(results)

        conn.sendall(b"OK ANALYSE_TERMINEE\n")

    except Exception as e:
        print("[Erreur analyse]", e)
        conn.sendall(b"ERR\n")

    conn.close()
    print("[-] Déconnexion Android")

def start_server():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind((HOST, PORT))
    s.listen()

    print(f"[+] Serveur analyse prêt sur {HOST}:{PORT}")

    while True:
        conn, addr = s.accept()
        threading.Thread(target=handle_client, args=(conn, addr)).start()

if __name__ == "__main__":
    start_server()
