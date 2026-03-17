from __future__ import annotations

import os

import requests


class AuthClient:
    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = (base_url or os.getenv("API_BASE_URL") or "http://127.0.0.1:8000").rstrip("/")

    def login(self, email: str, password: str) -> dict:
        resp = requests.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password},
            timeout=15,
        )
        self._raise_for_status(resp)
        return resp.json()

    def moodle_login(self, username: str, password: str, role: str = "teacher") -> dict:
        resp = requests.post(
            f"{self.base_url}/auth/moodle/login",
            json={"username": username, "password": password, "role": role},
            timeout=20,
        )
        self._raise_for_status(resp)
        return resp.json()

    @staticmethod
    def _raise_for_status(resp: requests.Response) -> None:
        if resp.ok:
            return
        try:
            detail = resp.json().get("detail")
        except Exception:
            detail = None
        message = detail or f"HTTP {resp.status_code}"
        raise RuntimeError(message)
