#!/bin/bash
echo "🚀 Setting up JEE Tribe DSB Challenge..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --ignore-scripts 2>&1

# Create .env.local if not exists
if [ ! -f .env.local ]; then
    echo ""
    echo "⚠️  No .env.local found."
    echo "   Create one with: echo 'GEMINI_API_KEY=your_key_here' > .env.local"
    echo "   Get your key from: https://aistudio.google.com/"
    echo ""
fi

# Start dev server
echo ""
echo "🎯 Starting the app..."
npx vite --port 3000 --host
