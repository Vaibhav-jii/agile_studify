#!/bin/bash
# Studify — start both frontend and backend with one command
# Usage: ./dev.sh

echo "🚀 Starting Studify..."

# Kill background processes on exit
cleanup() {
  echo ""
  echo "🛑 Shutting down Studify..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "✅ Stopped."
}
trap cleanup EXIT INT TERM

# --- Backend ---
echo "⚙️  Starting backend (FastAPI on :8000)..."
(cd "$(dirname "$0")/backend" && python3 -m uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

# --- Frontend ---
echo "🎨 Starting frontend (Vite on :3000)..."
(cd "$(dirname "$0")/frontend" && npx vite --port 3000) &
FRONTEND_PID=$!

echo ""
echo "✅ Studify is running!"
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:8000"
echo "   API Docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait for either to exit
wait
