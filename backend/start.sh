#!/bin/bash
set -e

# Print environment information
echo "Starting Personal Assistant Backend"
echo "=================================="
echo "User: $(whoami)"
echo "Working directory: $(pwd)"
echo "Database path: $DB_PATH"
echo "AWS credentials: $(ls -la ~/.aws 2>/dev/null || echo 'Not found')"
echo "=================================="

# Initialize the database
python init_db.py

# Start the application
python app.py