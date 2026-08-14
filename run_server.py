"""
Run from project root to serve static files on port 9000:

    python run_server.py

Then open http://localhost:9000
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import sys

# Serve files from the script directory (robust fallback to cwd)
root_dir = os.path.dirname(os.path.abspath(__file__)) or os.getcwd()
os.chdir(root_dir)

PORT = int(os.environ.get('PORT', '9000'))
HOST = os.environ.get('HOST', '127.0.0.1')

class Handler(SimpleHTTPRequestHandler):
    pass

def run():
    try:
        with HTTPServer((HOST, PORT), Handler) as httpd:
            print(f"Serving HTTP on {HOST} port {PORT} (http://{HOST}:{PORT}/) ...")
            httpd.serve_forever()
    except OSError as e:
        print(f"Failed to start server on {HOST}:{PORT}: {e}")
        print("If the port is in use, stop the other process or choose a different port.")
        sys.exit(1)
    except KeyboardInterrupt:
        print('\nStopping server')

if __name__ == '__main__':
    run()
