import os
import sqlite3

def get_db_connection():
    """Get a connection to the SQLite database using the path from environment variable"""
    db_path = os.environ.get('DB_PATH', 'appointments.db')
    
    # Print debug information
    print(f"Connecting to database at: {db_path}")
    
    # Check if directory exists, create if not
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        try:
            os.makedirs(db_dir, exist_ok=True)
            print(f"Created directory: {db_dir}")
        except Exception as e:
            print(f"Error creating directory {db_dir}: {str(e)}")
    
    # Check if we can write to the directory
    if db_dir and not os.access(db_dir, os.W_OK):
        print(f"Warning: No write access to directory: {db_dir}")
        # Try to fix permissions
        try:
            os.chmod(db_dir, 0o777)  # Full permissions
            print(f"Updated permissions for directory: {db_dir}")
        except Exception as e:
            print(f"Error updating permissions: {str(e)}")
    
    try:
        conn = sqlite3.connect(db_path)
        print(f"Successfully connected to database at {db_path}")
        return conn
    except Exception as e:
        print(f"Error connecting to database at {db_path}: {str(e)}")
        # Fall back to in-memory database
        print("Falling back to in-memory database")
        return sqlite3.connect(':memory:')