#!/usr/bin/env bash
# ==============================================================================
# SynapSYS IIoT Platform - Unified Prototype Launcher
# Problem Statement: PS-002 Real-Time Production Monitoring & OEE Dashboard
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "======================================================================"
echo " Starting SynapSYS Real-Time IIoT Production Monitoring Stack"
echo "======================================================================"

# 1. Virtual Environment Setup for Python
if [ ! -d "venv" ]; then
    echo "[+] Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "[+] Activating virtual environment..."
source venv/bin/activate

echo "[+] Installing backend and simulator Python dependencies..."
pip install --upgrade pip --quiet
pip install -r backend/requirements.txt --quiet
pip install -r simulator/requirements.txt --quiet

# 2. Trap for clean shutdown on Ctrl+C
cleanup() {
    echo ""
    echo "[!] Caught shutdown signal! Stopping all running services..."
    kill $(jobs -p) 2>/dev/null || true
    echo "[✓] All services terminated."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Start FastAPI Backend
echo "[+] Starting FastAPI backend on http://localhost:8000..."
(
    cd backend
    uvicorn main:app --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

# Wait briefly for backend to initialize
sleep 2

# 4. Start Python Machine Simulator
echo "[+] Starting Synthetic Telemetry Simulator (streams every 2s)..."
(
    cd simulator
    python3 simulator.py
) &
SIMULATOR_PID=$!

# 5. Start React Frontend (if npm is available)
if command -v npm &> /dev/null; then
    echo "[+] Node.js & npm detected. Starting React Frontend on http://localhost:5173..."
    (
        cd frontend
        if [ ! -d "node_modules" ]; then
            echo "[+] Installing frontend node dependencies..."
            npm install --silent
        fi
        npm run dev
    ) &
    FRONTEND_PID=$!
else
    echo "[!] Notice: 'npm' is not installed in this environment."
    echo "[!] Install Node.js & npm to view the React frontend: "
    echo "    Arch Linux: sudo pacman -S nodejs npm"
    echo "    Ubuntu/WSL2: sudo apt update && sudo apt install -y nodejs npm"
    echo "    Then run: cd frontend && npm install && npm run dev"
fi

echo ""
echo "======================================================================"
echo " SynapSYS Platform Services Live:"
echo "   - Backend API:       http://localhost:8000"
echo "   - API Swagger Docs:  http://localhost:8000/docs"
echo "   - Dashboard JSON:    http://localhost:8000/api/dashboard"
echo "   - React Frontend:    http://localhost:5173"
echo " Press Ctrl+C at any time to gracefully terminate all services."
echo "======================================================================"
echo ""

# Keep running and wait for background jobs
wait

