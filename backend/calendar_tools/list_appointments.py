import os
from strands import tool
from db_utils import get_db_connection


@tool
def list_appointments() -> str:
    """
    List all available appointments from the database with nice formatting.

    Returns:
        str: Formatted list of all appointments 
    """
    # Check if database exists
    db_path = os.environ.get('DB_PATH', 'appointments.db')
    if not os.path.exists(db_path):
        return "📅 No appointments found\n\nYour calendar is empty! Time to schedule something exciting! ✨"

    conn = get_db_connection()
    conn.row_factory = sqlite3.Row  # This enables column access by name
    cursor = conn.cursor()

    # Check if the appointments table exists
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='appointments'")
        if not cursor.fetchone():
            conn.close()
            return "📅 No appointments found\n\nYour calendar is empty! Time to schedule something exciting! ✨"

        cursor.execute("SELECT * FROM appointments ORDER BY date")
        rows = cursor.fetchall()

        if not rows:
            conn.close()
            return "📅 No appointments found\n\nYour calendar is empty! Time to schedule something exciting! ✨"

        # Format the appointments list
        appointment_lines = [
            "📋 All Your Appointments:",
            "=======================================",
            ""
        ]

        for i, row in enumerate(rows, 1):
            # Extract date and time parts
            date_part = row['date'].split(" ")[0] if " " in row['date'] else row['date']
            time_part = row['date'].split(" ")[1] if " " in row['date'] else "No time specified"

            appointment_lines.extend([
                f"{i}. 📝 {row['title']}",
                f"   📅 Date: {date_part}",
                f"   🕐 Time: {time_part}",
                f"   📍 Location: {row['location']}",
                f"   📄 Description: {row['description']}",
                f"   🆔 ID: {row['id']}",
                ""  # Empty line for spacing
            ])

        conn.close()
        return "\n".join(appointment_lines)

    except sqlite3.Error as e:
        conn.close()
        return f"❌ Error retrieving appointments: {str(e)}"