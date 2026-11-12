"""
SynapSYS Root ASGI Entrypoint
Enables running `uvicorn main:app` directly from the project root or workspace root.
"""
import sys
import os

backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.main import app

__all__ = ["app"]

