# SMART EDU JOURNAL

Production-oriented educational platform for colleges/universities with:
- FastAPI backend
- PostgreSQL central DB
- PySide6 desktop app (teachers)
- Flutter mobile app (students)
- Next.js web admin
- Telegram bot (aiogram)
- Moodle sync service
- Local network support

## Project Structure

```
backend/
desktop_app/
mobile_app/
web/
telegram_bot/
storage/homework/
```

## Quick Start

1. Copy `.env.example` to `.env` and adjust values.
2. Run:
   ```bash
   docker compose up --build
   ```
3. Backend API: `http://localhost:8000/docs`
4. Web admin: `http://localhost:3000`

## Backend Endpoints

- `POST /auth/moodle/login`
- `POST /auth/refresh`
- `GET /student/courses`
- `GET /student/attendance`
- `GET /student/homework`
- `GET /student/notifications`
- `POST /teacher/attendance/mark`
- `GET /teacher/attendance`
- `POST /teacher/homework/create`
- `GET /teacher/statistics`
- `GET /teacher/reports/attendance.xlsx`
- `GET /admin/users`
- `POST /admin/create-course`
- `POST /moodle/sync`

## Desktop App (Teacher)

```bash
cd desktop_app
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

Desktop and web login use:
- Moodle auth (`/auth/moodle/login`)

Role model:
- `student`: read-only academic access
- `assistant`: a student who entered a one-time teacher code for selected courses
- `teacher`: manages owned courses, attendance, homework, and assistants
- `admin`: full platform access through the admin panel

Admin bootstrap:
- set `ADMIN_EMAILS` to Moodle emails that must become admins automatically
- or set `ADMIN_USERNAMES` to Moodle usernames that must become admins automatically
- optional `BOOTSTRAP_ADMIN_EMAIL` creates an admin record on startup so the same Moodle email is promoted immediately on first sign-in

To package `.exe` on Windows:
```bash
pip install pyinstaller
pyinstaller --noconfirm --onefile --windowed main.py --name SmartEduJournalTeacher
```

To build a macOS `.app` bundle:
```bash
cd desktop_app
chmod +x build_macos.command
./build_macos.command
```

The packaged app will be created at:
```bash
desktop_app/dist/SMART EDU JOURNAL Teacher.app
```

Notes:
- macOS build script expects Python 3.9+
- the desktop app still needs the backend API running for login to work
- if Gatekeeper blocks first launch, right-click the app and choose `Open`

One-click Mac desktop launcher:
```bash
chmod +x run_mac.command
./run_mac.command
```

What it does:
- installs backend dependencies if needed
- builds the macOS desktop app if needed
- starts the backend locally on SQLite at `http://127.0.0.1:8000`
- creates a local teacher account if it does not exist
- opens the packaged desktop app

## Mobile App (Student)

```bash
cd mobile_app
flutter pub get
flutter run
```

Set API base URL for LAN use to `http://192.168.0.10:8000`.

## Telegram Bot

```bash
cd telegram_bot
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Local Network
Set mobile API URL to LAN host, e.g. `http://192.168.0.10:8000`.

## Storage
Homework files are stored under `storage/homework/`.

## Moodle Without API Token

If you do not have `MOODLE_TOKEN`, integration can work via Moodle login/password:
- set `MOODLE_BASE_URL`
- set `MOODLE_USERNAME`
- set `MOODLE_PASSWORD`

Backend will fallback to session-based login + page parsing for:
- course sync
- enrollments fetch

Moodle auth endpoint for app login:
- `POST /auth/moodle/login` with body:
  - `username`
  - `password`
  - optional `role` (`teacher` or `student`)
# CloudeStudys
Что установить на Windows

Установите Docker Desktop.
Установите Python 3.11+.
Установите Node.js LTS.
Если нужен мобильный клиент, установите Flutter.
Перезагрузите ПК после установки, чтобы команды появились в PowerShell.
Шаг 1. Откройте PowerShell в папке проекта

cd C:\путь\до\CloudeStudy
Пример:

cd C:\Users\YourName\Desktop\CloudeStudy
Шаг 2. Убедитесь, что есть файл .env

В корне проекта должен быть файл .env.

Если его нет, создайте вручную файл .env в папке проекта и вставьте туда:

POSTGRES_DB=smartedu
POSTGRES_USER=smartedu
POSTGRES_PASSWORD=smartedu

DATABASE_URL=postgresql+psycopg2://smartedu:smartedu@db:5432/smartedu
REDIS_URL=redis://redis:6379/0
JWT_SECRET=local-dev-secret
WEB_ORIGIN=http://localhost:3000

NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
Шаг 3. Запустите Docker Desktop

Дождитесь, пока Docker полностью запустится.

Шаг 4. Поднимите backend, web, postgres, redis и bot

В PowerShell из корня проекта выполните:

docker compose up --build
Подождите, пока контейнеры соберутся и стартуют.

Шаг 5. Проверьте, что всё запустилось

Откройте в браузере:

http://localhost:8000/docs
http://localhost:3000
Если обе страницы открываются, значит backend и web работают.

Шаг 6. Если нужен desktop app для Windows

Откройте новое окно PowerShell:

cd C:\путь\до\CloudeStudy\desktop_app
py -3 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
Важно:

backend уже должен быть запущен
run_mac.command на Windows не работает
Шаг 7. Если нужен Telegram bot отдельно

Если bot не стартовал через Docker или хотите запустить руками:

cd C:\путь\до\CloudeStudy\telegram_bot
py -3 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
Шаг 8. Если нужен mobile app

cd C:\путь\до\CloudeStudy\mobile_app
flutter pub get
flutter run
Если запускаете на телефоне, используйте IP вашего компьютера в сети, например:
http://192.168.0.10:8000

Если хотите запустить только backend и web без Docker

Backend:

cd C:\путь\до\CloudeStudy\backend
py -3 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
Web:

cd C:\путь\до\CloudeStudy\web
npm install
npm run dev
Самый короткий сценарий для вас

Установить Docker Desktop, Python, Node.js
Перейти в папку проекта
Создать .env
Выполнить:
docker compose up --build
Открыть:
http://localhost:8000/docs
http://localhost:3000

