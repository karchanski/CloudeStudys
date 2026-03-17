from __future__ import annotations

import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from api.config import settings
from models.course import Course


class MoodleService:
    @staticmethod
    def auth_mode() -> str:
        if settings.moodle_token and settings.moodle_token != "CHANGE_ME":
            return "token"
        if settings.moodle_username and settings.moodle_password:
            return "credentials"
        return "not_configured"

    @staticmethod
    async def test_connection() -> tuple[bool, str]:
        try:
            courses = await MoodleService.fetch_courses()
            return True, f"Connection ok. Visible courses: {len(courses)}"
        except Exception as exc:
            return False, str(exc)

    @staticmethod
    async def _login_client_with_credentials(username: str, password: str) -> tuple[httpx.AsyncClient, str]:
        client = httpx.AsyncClient(timeout=20, follow_redirects=True)
        login_url = f"{settings.moodle_base_url}/login/index.php"
        resp = await client.get(login_url)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        token_input = soup.select_one('input[name="logintoken"]')
        logintoken = token_input.get("value", "") if token_input else ""

        payload = {
            "username": username,
            "password": password,
        }
        if logintoken:
            payload["logintoken"] = logintoken

        auth_resp = await client.post(login_url, data=payload)
        auth_resp.raise_for_status()

        # If still on login page with login form, auth failed.
        if "/login/index.php" in str(auth_resp.url) and 'name="password"' in auth_resp.text:
            await client.aclose()
            raise RuntimeError("Moodle login failed. Check username/password")

        return client, auth_resp.text

    @staticmethod
    async def _login_client() -> httpx.AsyncClient:
        client, _ = await MoodleService._login_client_with_credentials(settings.moodle_username, settings.moodle_password)
        return client

    @staticmethod
    async def authenticate_user(username: str, password: str) -> dict:
        client, html = await MoodleService._login_client_with_credentials(username, password)
        try:
            soup = BeautifulSoup(html, "html.parser")
            name = ""
            email = ""

            for selector in ["span.usertext", ".usermenu .usertext", "title"]:
                node = soup.select_one(selector)
                if node and node.get_text(strip=True):
                    name = node.get_text(" ", strip=True)
                    break

            if not name:
                name = username

            email_link = soup.select_one('a[href^="mailto:"]')
            if email_link:
                email = email_link.get_text(strip=True) or email_link.get("href", "").replace("mailto:", "").strip()

            # Ensure a deterministic email for local account mapping.
            local_email = email if email else f"moodle_{username}@moodle.local"

            return {
                "username": username,
                "name": name,
                "email": local_email.lower(),
            }
        finally:
            await client.aclose()

    @staticmethod
    async def fetch_courses() -> list[dict]:
        # Primary mode: Moodle webservice token.
        if settings.moodle_token and settings.moodle_token != "CHANGE_ME":
            params = {
                "wstoken": settings.moodle_token,
                "wsfunction": "core_course_get_courses",
                "moodlewsrestformat": "json",
            }
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.get(f"{settings.moodle_base_url}/webservice/rest/server.php", params=params)
                resp.raise_for_status()
                data = resp.json()
                if isinstance(data, dict) and data.get("exception"):
                    return []
                return data if isinstance(data, list) else []

        # Fallback mode: login/password + HTML parsing.
        if not settings.moodle_username or not settings.moodle_password:
            return []

        client = await MoodleService._login_client()
        try:
            resp = await client.get(f"{settings.moodle_base_url}/my/courses.php")
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            courses: list[dict] = []
            seen_ids: set[str] = set()
            for a in soup.select('a[href*="/course/view.php?id="]'):
                href = a.get("href", "")
                text = a.get_text(strip=True)
                if not href or not text:
                    continue
                if "id=" not in href:
                    continue
                course_id = href.split("id=")[-1].split("&")[0]
                if not course_id.isdigit() or course_id in seen_ids:
                    continue
                seen_ids.add(course_id)
                courses.append({"id": int(course_id), "displayname": text, "fullname": text})
            return courses
        finally:
            await client.aclose()

    @staticmethod
    async def fetch_enrollments(moodle_course_id: str) -> list[dict]:
        # Primary mode: webservice token.
        if settings.moodle_token and settings.moodle_token != "CHANGE_ME":
            params = {
                "wstoken": settings.moodle_token,
                "wsfunction": "core_enrol_get_enrolled_users",
                "moodlewsrestformat": "json",
                "courseid": moodle_course_id,
            }
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.get(f"{settings.moodle_base_url}/webservice/rest/server.php", params=params)
                resp.raise_for_status()
                data = resp.json()
                return data if isinstance(data, list) else []

        # Fallback mode: login/password + HTML parsing.
        if not settings.moodle_username or not settings.moodle_password:
            return []

        client = await MoodleService._login_client()
        try:
            # Common Moodle participants list URL.
            resp = await client.get(f"{settings.moodle_base_url}/user/index.php?id={moodle_course_id}")
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            users: list[dict] = []
            # Try to parse table rows (works for standard themes).
            for row in soup.select("table tbody tr"):
                cols = row.select("td")
                if not cols:
                    continue
                fullname = cols[0].get_text(" ", strip=True)
                email = ""
                for col in cols:
                    text = col.get_text(" ", strip=True)
                    if "@" in text and "." in text:
                        email = text
                        break
                if fullname:
                    users.append({"fullname": fullname, "email": email})
            return users
        finally:
            await client.aclose()

    @staticmethod
    async def sync_courses(db: Session, default_teacher_id: int | None = None) -> int:
        courses = await MoodleService.fetch_courses()
        synced = 0
        for item in courses:
            moodle_id = str(item.get("id"))
            name = item.get("displayname") or item.get("fullname") or "Untitled Moodle Course"
            existing = db.query(Course).filter(Course.moodle_id == moodle_id).first()
            if existing:
                existing.name = name
            elif default_teacher_id:
                db.add(Course(name=name, teacher_id=default_teacher_id, moodle_id=moodle_id))
            synced += 1

        db.commit()
        return synced
