#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

APP_NAME="SMART EDU JOURNAL Teacher.app"
SPEC_FILE="SMART_EDU_JOURNAL_Teacher.spec"

ensure_pip() {
  if ! .venv/bin/python -m pip --version >/dev/null 2>&1; then
    echo "[STEP] Recreating broken desktop_app venv..."
    rm -rf .venv
    python3 -m venv .venv
  fi
}

echo "=========================================="
echo "SMART EDU JOURNAL - macOS App Builder"
echo "=========================================="

if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERROR] python3 not found. Install Python 3.9+ and run again."
  exit 1
fi

PY_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "[INFO] Detected Python $PY_VER"
case "$PY_VER" in
  3.[9]|3.1[0-9]|3.[2-9][0-9]) ;;
  *)
    echo "[ERROR] Python 3.9+ is required for the build (current: $PY_VER)"
    exit 1
    ;;
esac

if [ ! -d .venv ]; then
  echo "[STEP] Creating desktop_app virtual environment..."
  python3 -m venv .venv
fi

ensure_pip

echo "[STEP] Installing desktop dependencies..."
.venv/bin/python -m pip install --upgrade pip
.venv/bin/pip install -r requirements.txt
.venv/bin/pip install pyinstaller

echo "[STEP] Cleaning previous build output..."
rm -rf build dist

echo "[STEP] Building macOS application..."
.venv/bin/pyinstaller "$SPEC_FILE" --noconfirm --distpath "$SCRIPT_DIR/dist" --workpath "$SCRIPT_DIR/build"

if [ ! -d "dist/$APP_NAME" ]; then
  echo "[ERROR] Build finished without creating dist/$APP_NAME"
  exit 1
fi

echo
echo "=========================================="
echo "Build complete"
echo "App bundle: $SCRIPT_DIR/dist/$APP_NAME"
echo "=========================================="
echo
echo "If macOS blocks the app on first launch:"
echo "1. Right-click the app"
echo "2. Choose Open"
echo "3. Confirm the security prompt"
