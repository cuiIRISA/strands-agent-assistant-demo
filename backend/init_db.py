import os
import sqlite3

def init_database():
    """Initialize the database with the appointments table"""
    db_path = os.environ.get('DB_PATH', 'appointments.db')
    
    print(f"Initializing database at: {db_path}")
    
    # Check if directory exists, create if not
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        try:
            os.makedirs(db_dir, exist_ok=True)
            print(f"Created directory: {db_dir}")
        except Exception as e:
            print(f"Error creating directory {db_dir}: {str(e)}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create the appointments table if it doesn't exist
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            date TEXT,
            location TEXT,
            title TEXT,
            description TEXT
        )
        """)
        
        conn.commit()
        conn.close()
        print(f"Database initialized successfully at {db_path}")
        return True
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        return False

if __name__ == "__main__":
    init_database()