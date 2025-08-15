#!/bin/bash

echo "🚀 Setting up KanbanFlow - JIRA-like Kanban Board"
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    echo "   Please update Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check for environment variables
echo ""
echo "🔧 Environment Configuration"
echo "============================="

if [ ! -f ".env.local" ]; then
    echo "⚠️  Environment file not found."
    echo "   Please create .env.local with your AWS credentials:"
    echo ""
    echo "   AWS_REGION=ap-northeast-1"
    echo "   AWS_ACCESS_KEY_ID=your_access_key_here"
    echo "   AWS_SECRET_ACCESS_KEY=your_secret_key_here"
    echo "   S3_BUCKET_NAME=your_bucket_name_here"
    echo ""
    echo "   Or set these as environment variables in your deployment platform."
else
    echo "✅ Environment file found: .env.local"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To build for production:"
echo "  npm run build"
echo "  npm start"
echo ""
echo "📖 Visit the README.md for detailed setup instructions"
echo "🌐 App will be available at: http://localhost:3000"
echo ""
echo "🔗 Quick Start:"
echo "   1. Set up your AWS S3 bucket and credentials"
echo "   2. Create .env.local with your AWS settings"
echo "   3. Run 'npm run dev'"
echo "   4. Visit http://localhost:3000 and try the demo!"
