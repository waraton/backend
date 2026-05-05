#!/bin/bash

# Waraton Backend - Setup Script
# This script downloads and installs all necessary dependencies to run the project

echo "================================"
echo "Waraton Backend Setup Script"
echo "================================"
echo ""

# Check if Node.js and npm are installed
echo "Checking for Node.js and npm..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✓ Node.js $(node --version) found"
echo "✓ npm $(npm --version) found"
echo ""

# Install dependencies
echo "Installing project dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Dependencies installed successfully!"
    echo ""
    echo "================================"
    echo "Setup Complete!"
    echo "================================"
    echo ""
    echo "Next steps:"
    echo "1. Create a .env file with your environment variables"
    echo "2. Run 'npm run dev' to start the development server"
    echo ""
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
