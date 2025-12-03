import tempfile

def receive_video(conn):
    header = conn.recv(1024).decode().strip()

    if not header.startswith("VIDEO"):
        raise Exception("Header invalide")

    _, size_str = header.split()
    size = int(size_str)

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    bytes_received = 0

    while bytes_received < size:
        chunk = conn.recv(min(4096, size - bytes_received))
        if not chunk:
            break
        tmp.write(chunk)
        bytes_received += len(chunk)

    tmp.close()
    return tmp.name
