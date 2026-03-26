#!/bin/bash

# SwiftAID Frontend Quick Start Script for Linux/Mac

echo ""
echo "===================================================="
echo "   SwiftAID - Emergency Response Dashboard"
echo "   Quick Start Installation"
echo "===================================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

echo "✓ Python found: $(python3 --version)"

# Navigate to frontend directory
cd "$(dirname "$0")"

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "ERROR: requirements.txt not found"
    exit 1
fi

echo ""
echo "Installing dependencies..."
python3 -m pip install --upgrade pip -q
python3 -m pip install -r requirements.txt -q

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"

echo ""
echo "===================================================="
echo "   Installation Complete!"
echo "===================================================="
echo ""
echo "IMPORTANT: Before running, ensure backend is started:"
echo ""
echo "  1. Open new terminal"
echo "  2. Navigate to: ../backend"
echo "  3. Run: python app.py"
echo ""
echo "THEN come back to this terminal and press Enter"
echo "to start the frontend server."
echo ""
echo "===================================================="
echo ""
read -p "Press Enter to continue..."

echo ""
echo "Starting SwiftAID Frontend Server..."
echo ""
python3 app.py
