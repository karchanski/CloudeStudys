#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")"

echo "=========================================="
echo "SMART EDU JOURNAL - Desktop Launcher"
echo "=========================================="

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[OK] Created .env from .env.example"
else
  echo "[OK] .env found"
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERROR] python3 not found. Install Python 3.9+"
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "[ERROR] curl not found"
  exit 1
fi

PY_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "[INFO] Detected Python $PY_VER"
case "$PY_VER" in
  3.[9]|3.1[0-9]|3.[2-9][0-9]) ;;
  *)
    echo "[ERROR] Python 3.9+ is required (current: $PY_VER)"
    exit 1
    ;;
esac

mkdir -p storage .run

BACKEND_DB_URL="sqlite:///../storage/local_desktop.db"
BACKEND_REDIS_URL="redis://localhost:6379/0"
BACKEND_JWT_SECRET="local-dev-secret"
BACKEND_STORAGE_ROOT="../storage"
BACKEND_LOG="$PWD/.run/backend.log"
BACKEND_PID_FILE="$PWD/.run/backend.pid"
DESKTOP_EMAIL="teacher@local.app"
DESKTOP_PASSWORD="teacher123"
APP_BUNDLE="$PWD/desktop_app/dist/SMART EDU JOURNAL Teacher.app"

ensure_pip() {
  local venv_path="$1"
  if ! "$venv_path/bin/python" -m pip --version >/dev/null 2>&1; then
    echo "[STEP] Recreating broken venv at $venv_path..."
    rm -rf "$venv_path"
    python3 -m venv "$venv_path"
  fi
}

if [ ! -d backend/.venv ]; then
  echo "[STEP] Creating backend venv..."
  python3 -m venv backend/.venv
fi

ensure_pip "$PWD/backend/.venv"

echo "[STEP] Installing backend dependencies..."
backend/.venv/bin/python -m pip install --upgrade pip
backend/.venv/bin/pip install -r backend/requirements-desktop.txt

if [ ! -x backend/.venv/bin/uvicorn ]; then
  echo "[ERROR] backend uvicorn was not installed correctly"
  exit 1
fi

if [ ! -d desktop_app/.venv ]; then
  echo "[STEP] Creating desktop app venv..."
  python3 -m venv desktop_app/.venv
fi

ensure_pip "$PWD/desktop_app/.venv"

if [ ! -d "$PWD/desktop_app/dist" ] || [ ! -d "$APP_BUNDLE" ]; then
  echo "[STEP] Building desktop app bundle..."
  chmod +x desktop_app/build_macos.command
  ./desktop_app/build_macos.command
else
  echo "[OK] Desktop app bundle already exists"
fi

if curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
  echo "[OK] Backend already running on http://127.0.0.1:8000"
else
  echo "[STEP] Starting local backend with SQLite..."
  (
    cd backend
    DATABASE_URL="$BACKEND_DB_URL" \
    REDIS_URL="$BACKEND_REDIS_URL" \
    JWT_SECRET="$BACKEND_JWT_SECRET" \
    STORAGE_ROOT="$BACKEND_STORAGE_ROOT" \
    nohup .venv/bin/uvicorn api.main:app --host 127.0.0.1 --port 8000 > "$BACKEND_LOG" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
  )

  for _ in {1..20}; do
    if curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  if ! curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "[ERROR] Backend did not start"
    echo "[INFO] Check log: $BACKEND_LOG"
    exit 1
  fi
fi

echo "[STEP] Ensuring local teacher account exists..."
(
  cd backend
  DATABASE_URL="$BACKEND_DB_URL" \
  REDIS_URL="$BACKEND_REDIS_URL" \
  JWT_SECRET="$BACKEND_JWT_SECRET" \
  STORAGE_ROOT="$BACKEND_STORAGE_ROOT" \
  .venv/bin/python - <<PY
from models.enums import UserRole
from models.user import User
from database.session import SessionLocal
from auth.security import hash_password

email = "${DESKTOP_EMAIL}"
password = "${DESKTOP_PASSWORD}"
name = "Local Teacher"

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.teacher,
        )
        db.add(user)
        db.commit()
    elif user.role != UserRole.teacher:
        user.role = UserRole.teacher
        db.commit()
finally:
    db.close()
PY
)

echo
echo "=========================================="
echo "Started."
echo "Backend: http://127.0.0.1:8000/docs"
echo "Desktop: $APP_BUNDLE"
echo "=========================================="
echo
echo "Login:"
echo "  Email:    $DESKTOP_EMAIL"
echo "  Password: $DESKTOP_PASSWORD"
echo
echo "[STEP] Opening desktop app..."
open "$APP_BUNDLE"
