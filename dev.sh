#!/bin/bash

# Studify Development Launcher
# Starts both the FastAPI backend and the Vite frontend.

# Get the directory where this script lives (project root)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Cleanup background processes on exit
trap "kill 0" EXIT

echo "--------------------------------------------------------"
echo "🎓 Studify Development Environment"
echo "--------------------------------------------------------"

# 1. Start backend
echo "📡 Starting FastAPI Backend (http://localhost:8000)..."
(cd "$SCRIPT_DIR/backend" && uvicorn main:app --host 127.0.0.1 --port 8000 --reload) &
BACKEND_PID=$!

# 2. Start frontend
echo "💻 Starting Vite Frontend (http://localhost:3000)..."
(cd "$SCRIPT_DIR/frontend" && npx vite --port 3000) &
FRONTEND_PID=$!

echo "--------------------------------------------------------"
echo "✅ Both servers are running!"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "--------------------------------------------------------"
echo "Press Ctrl+C to stop both servers."

# Keep the script running
wait $BACKEND_PID $FRONTEND_PID
