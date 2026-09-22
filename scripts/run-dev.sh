#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "    REHABSENSE — CAMERA-ASSISTED REHABILITATION COACH     "
echo "    Problem Statement 05 | Team TechHives                 "
echo "=========================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 1. Start Python FastAPI API Server
echo "Starting Backend API (FastAPI on http://localhost:8000)..."
cd "$ROOT_DIR/apps/api"
python3 -m uvicorn main:app --reload --port 8000 &
API_PID=$!

# 2. Start Next.js Web Frontend
echo "Starting Frontend Web (Next.js on http://localhost:3000)..."
cd "$ROOT_DIR/apps/web"
npm run dev &
WEB_PID=$!

trap "kill $API_PID $WEB_PID 2>/dev/null || true; exit 0" SIGINT SIGTERM EXIT

echo "✓ Both services running!"
echo "• Web App:   http://localhost:3000"
echo "• Demo Hub:  http://localhost:3000/demo"
echo "• API Docs:  http://localhost:8000/docs"
echo "Press Ctrl+C to stop both servers."

wait
