import subprocess
import os

root = os.path.dirname(os.path.abspath(__file__))

backend = subprocess.Popen(
    ["bash", "-c", f"cd {root}/backend && source venv/bin/activate && uvicorn app.main:socket_app --reload"],
    stdout=None,
    stderr=None
)

frontend = subprocess.Popen(
    ["bash", "-c", f"cd {root}/frontend && npm run dev"],
    stdout=None,
    stderr=None
)

backend.wait()
frontend.wait()