from __future__ import annotations

import json
import re
from typing import Any

from api.config import settings

try:
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
except Exception:  # pragma: no cover
    Credentials = None
    build = None


class GoogleSheetsService:
    scope = ["https://www.googleapis.com/auth/spreadsheets"]

    @staticmethod
    def _spreadsheet_id_from_url(url: str) -> str | None:
        match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", url)
        return match.group(1) if match else None

    @staticmethod
    def _service():
        if not settings.google_service_account_json:
            return None
        if Credentials is None or build is None:
            return None
        info = json.loads(settings.google_service_account_json)
        credentials = Credentials.from_service_account_info(info, scopes=GoogleSheetsService.scope)
        return build("sheets", "v4", credentials=credentials)

    @staticmethod
    def sync_grade(google_sheet_url: str | None, row: dict[str, Any]) -> bool:
        if not google_sheet_url:
            return False
        service = GoogleSheetsService._service()
        spreadsheet_id = GoogleSheetsService._spreadsheet_id_from_url(google_sheet_url)
        if not service or not spreadsheet_id:
            return False

        values = [[
            str(row.get("submission_id", "")),
            row.get("course_name", ""),
            row.get("homework_title", ""),
            row.get("student_name", ""),
            row.get("student_email", ""),
            row.get("grade", ""),
            row.get("feedback", ""),
            row.get("graded_at", ""),
        ]]

        existing = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=spreadsheet_id, range="Grades!A:H")
            .execute()
        )
        rows = existing.get("values", [])
        target_row_number = None
        for index, existing_row in enumerate(rows, start=1):
            if existing_row and existing_row[0] == str(row.get("submission_id", "")):
                target_row_number = index
                break

        if target_row_number:
            (
                service.spreadsheets()
                .values()
                .update(
                    spreadsheetId=spreadsheet_id,
                    range=f"Grades!A{target_row_number}:H{target_row_number}",
                    valueInputOption="USER_ENTERED",
                    body={"values": values},
                )
                .execute()
            )
        else:
            (
                service.spreadsheets()
                .values()
                .append(
                    spreadsheetId=spreadsheet_id,
                    range="Grades!A:H",
                    valueInputOption="USER_ENTERED",
                    insertDataOption="INSERT_ROWS",
                    body={"values": values},
                )
                .execute()
            )
        return True
