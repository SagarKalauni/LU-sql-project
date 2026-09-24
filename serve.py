import os
import webbrowser
import http.server
import socketserver

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    port = PORT
    while port < 8020:
        try:
            with socketserver.TCPServer(("", port), Handler) as httpd:
                url = f"http://localhost:{port}/index.html"
                print("=" * 65)
                print("  LINDENWOOD UNIVERSITY - THE MISSING GOLDEN LION SQL MYSTERY")
                print("=" * 65)
                print(f"Server successfully started at: {url}")
                print("Serving database and web files...")
                print("Press Ctrl+C to stop the server at any time.")
                print("=" * 65)
                webbrowser.open(url)
                httpd.serve_forever()
                break
        except OSError:
            port += 1

if __name__ == '__main__':
    start_server()
