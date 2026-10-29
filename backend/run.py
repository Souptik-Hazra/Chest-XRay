import uvicorn
import os
import sys

# Ensure backend package is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", "8000"))
    host = os.getenv("API_HOST", "127.0.0.1")
    print(f"Starting ChestX AI FastAPI Server on http://{host}:{port} ...")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
