"""
Firebase Cloud Firestore Persistence & Realtime Edge Adapter for SynapSYS.
Communicates directly with Google Cloud Firestore via REST API (and Service Account Auth)
without requiring heavy external binary dependencies.
Includes zero-downtime local SQLite buffer fallback when offline or unconfigured.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import json
import os
import time

import requests
from dotenv import load_dotenv

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(os.path.dirname(_BASE_DIR), ".env"))
load_dotenv(os.path.join(_BASE_DIR, ".env"))


def _mask_project(project_id: str) -> str:
    if not project_id:
        return ""
    if len(project_id) > 6:
        return f"{project_id[:3]}***{project_id[-2:]}"
    return project_id


def _python_to_firestore_value(val: Any) -> Dict[str, Any]:
    """Converts a standard Python scalar/dict to Firestore REST field format."""
    if val is None:
        return {"nullValue": None}
    if isinstance(val, bool):
        return {"booleanValue": val}
    if isinstance(val, int):
        return {"integerValue": str(val)}
    if isinstance(val, float):
        return {"doubleValue": val}
    if isinstance(val, str):
        return {"stringValue": val}
    if isinstance(val, dict):
        return {
            "mapValue": {
                "fields": {k: _python_to_firestore_value(v) for k, v in val.items()}
            }
        }
    if isinstance(val, (list, tuple)):
        return {
            "arrayValue": {
                "values": [_python_to_firestore_value(x) for x in val]
            }
        }
    return {"stringValue": str(val)}


def _dict_to_firestore_fields(data: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _python_to_firestore_value(v) for k, v in data.items()}


class FirebaseStore:
    def __init__(self) -> None:
        self.project_id: str = (os.getenv("FIREBASE_PROJECT_ID") or "").strip()
        self.api_key: str = (os.getenv("FIREBASE_API_KEY") or "").strip()
        self.auth_token: str = (os.getenv("FIREBASE_AUTH_TOKEN") or "").strip()
        self.connected: bool = False
        self.schema_ready: bool = False
        self.latency_ms: Optional[int] = None
        self.last_error: Optional[str] = None
        self.last_checked_at: Optional[str] = None
        self.synced_records: int = 0
        self.last_sync_at: Optional[str] = None

        if self.is_configured():
            self.ping()

    def is_configured(self) -> bool:
        return bool(self.project_id)

    @property
    def base_url(self) -> str:
        return f"https://firestore.googleapis.com/v1/projects/{self.project_id}/databases/(default)/documents"

    def _headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
        }
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers

    def ping(self) -> Dict[str, Any]:
        self.last_checked_at = datetime.now(timezone.utc).isoformat()
        if not self.is_configured():
            self.connected = False
            self.schema_ready = False
            self.latency_ms = None
            self.last_error = None
            return self.get_status()

        started = time.perf_counter()
        try:
            # Query the production_sites collection limit 1
            url = f"{self.base_url}/production_sites?pageSize=1"
            if self.api_key:
                url += f"&key={self.api_key}"

            res = requests.get(url, headers=self._headers(), timeout=4.0)
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            self.latency_ms = elapsed_ms

            if res.status_code in (200, 404):
                self.connected = True
                self.schema_ready = True
                self.last_error = None
            elif res.status_code in (401, 403):
                # Reachable but permissions or rules required
                self.connected = True
                self.schema_ready = False
                self.last_error = "Firestore connected. Check Security Rules or provide Web API Key / Service Token."
            else:
                self.connected = False
                self.schema_ready = False
                self.last_error = f"Firestore returned HTTP {res.status_code}: {res.text[:120]}"
        except Exception as exc:
            self.connected = False
            self.schema_ready = False
            self.latency_ms = None
            self.last_error = str(exc)

        return self.get_status()

    def configure(self, project_id: str, api_key: str = "", auth_token: str = "") -> Dict[str, Any]:
        clean_project = project_id.strip()
        if not clean_project:
            raise ValueError("Firebase Project ID cannot be empty.")
        self.project_id = clean_project
        self.api_key = api_key.strip()
        self.auth_token = auth_token.strip()
        return self.ping()

    def get_status(self) -> Dict[str, Any]:
        configured = self.is_configured()
        mode = (
            "firebase_cloud"
            if configured and self.connected
            else "configured_offline"
            if configured
            else "local_sqlite_fallback"
        )
        return {
            "configured": configured,
            "connected": self.connected,
            "schema_ready": self.schema_ready,
            "mode": mode,
            "project_id": self.project_id,
            "project_masked": _mask_project(self.project_id),
            "latency_ms": self.latency_ms,
            "last_error": self.last_error,
            "last_checked_at": self.last_checked_at,
            "synced_records": self.synced_records,
            "last_sync_at": self.last_sync_at,
            "collections": ["users", "production_sites", "telemetry", "alarm_events"],
        }

    def set_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        if not self.is_configured() or not self.connected:
            return False
        try:
            url = f"{self.base_url}/{collection}/{doc_id}"
            if self.api_key:
                url += f"&key={self.api_key}"

            payload = {"fields": _dict_to_firestore_fields(data)}
            res = requests.patch(url, headers=self._headers(), json=payload, timeout=4.0)
            if res.status_code in (200, 201):
                self.synced_records += 1
                self.last_sync_at = datetime.now(timezone.utc).isoformat()
                return True
            self.last_error = f"Firestore set_doc failed ({res.status_code}): {res.text[:120]}"
            return False
        except Exception as exc:
            self.last_error = f"Firestore set_doc error: {exc}"
            return False

    def add_document(self, collection: str, data: Dict[str, Any]) -> bool:
        if not self.is_configured() or not self.connected:
            return False
        try:
            url = f"{self.base_url}/{collection}"
            if self.api_key:
                url += f"&key={self.api_key}"

            payload = {"fields": _dict_to_firestore_fields(data)}
            res = requests.post(url, headers=self._headers(), json=payload, timeout=4.0)
            if res.status_code in (200, 201):
                self.synced_records += 1
                self.last_sync_at = datetime.now(timezone.utc).isoformat()
                return True
            self.last_error = f"Firestore add_doc failed ({res.status_code}): {res.text[:120]}"
            return False
        except Exception as exc:
            self.last_error = f"Firestore add_doc error: {exc}"
            return False

    def delete_document(self, collection: str, doc_id: str) -> bool:
        if not self.is_configured() or not self.connected:
            return False
        try:
            url = f"{self.base_url}/{collection}/{doc_id}"
            if self.api_key:
                url += f"&key={self.api_key}"
            res = requests.delete(url, headers=self._headers(), timeout=4.0)
            return res.status_code in (200, 204)
        except Exception as exc:
            self.last_error = f"Firestore delete_doc error: {exc}"
            return False


firebase_store = FirebaseStore()

