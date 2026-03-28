import socket

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

with open("port_check.log", "w") as f:
    f.write(f"Port 8001: {'Listening' if check_port(8001) else 'Not Listening'}\n")
    f.write(f"Port 5173: {'Listening' if check_port(5173) else 'Not Listening'}\n")
