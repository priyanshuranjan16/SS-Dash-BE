#!/bin/bash

echo "Starting MongoDB for D Dash Backend..."
echo

# Check if MongoDB is already running
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB is already running"
    exit 0
fi

# Try to start MongoDB service
echo "Attempting to start MongoDB service..."

# Check OS and start accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    brew services start mongodb-community 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB service started successfully (macOS)"
    else
        echo "❌ Failed to start MongoDB service"
        echo
        echo "Please ensure MongoDB is installed:"
        echo "brew install mongodb-community"
        echo
        echo "Alternative: Use Docker to run MongoDB:"
        echo "docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    sudo systemctl start mongod 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB service started successfully (Linux)"
    else
        echo "❌ Failed to start MongoDB service"
        echo
        echo "Please ensure MongoDB is installed:"
        echo "sudo apt install mongodb"
        echo
        echo "Alternative: Use Docker to run MongoDB:"
        echo "docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest"
    fi
else
    echo "❌ Unsupported operating system"
    echo "Please start MongoDB manually or use Docker"
fi

echo
echo "Next steps:"
echo "1. Create a .env file in the backend directory"
echo "2. Run: npm install"
echo "3. Run: npm run dev"
echo
