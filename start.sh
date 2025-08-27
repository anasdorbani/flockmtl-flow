#!/bin/bash

# FlockMTL Startup Script

echo "🚀 Starting FlockMTL with Dynamic Table Management"
echo "=================================================="

# Check if we're in the project root
if [[ ! -d "backend" || ! -d "frontend" ]]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check for OpenAI API Key
if [[ -z "$OPENAI_API_KEY" ]]; then
    echo "⚠️  Warning: OPENAI_API_KEY environment variable not set"
    echo "   You'll need to set this for AI functionality to work"
    echo "   export OPENAI_API_KEY='your-api-key-here'"
    echo ""
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command_exists uv && ! command_exists pip; then
    echo "❌ Neither uv nor pip found. Please install one of them."
    exit 1
fi

if ! command_exists pnpm && ! command_exists npm; then
    echo "❌ Neither pnpm nor npm found. Please install one of them."
    exit 1
fi

# Start backend
echo "🔧 Starting backend..."
cd backend

if [[ -f "uv.lock" ]] && command_exists uv; then
    echo "   Using uv for backend..."
    export LOAD_SAMPLE_DATA="true"
    uv run fastapi dev app/main.py &
    BACKEND_PID=$!
else
    echo "   Using pip for backend..."
    export LOAD_SAMPLE_DATA="true"
    python -m uvicorn app.main:app --reload &
    BACKEND_PID=$!
fi

cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend..."
cd frontend

# Create .env.local if it doesn't exist
if [[ ! -f ".env.local" ]]; then
    echo "BACKEND_URL=http://localhost:8000" > .env.local
    echo "   Created .env.local with BACKEND_URL=http://localhost:8000"
fi

if command_exists pnpm; then
    echo "   Using pnpm for frontend..."
    if [[ ! -d "node_modules" ]]; then
        pnpm install
    fi
    pnpm dev &
    FRONTEND_PID=$!
else
    echo "   Using npm for frontend..."
    if [[ ! -d "node_modules" ]]; then
        npm install
    fi
    npm run dev &
    FRONTEND_PID=$!
fi

cd ..

# Print status
echo ""
echo "✅ FlockMTL is starting up!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "📚 Features available:"
echo "   • Upload CSV files or DuckDB databases"
echo "   • Select tables for querying"
echo "   • Ask natural language questions about your data"
echo "   • View query execution pipelines"
echo ""
echo "🛑 To stop both servers, press Ctrl+C"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to handle interruption
trap cleanup INT

# Wait for user interruption
wait
