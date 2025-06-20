FROM python:3.12-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Create directory for temporary database with proper permissions
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/appointments.db

# Create a non-root user to run the application
RUN useradd -m appuser

# Create .aws directory for the appuser
RUN mkdir -p /home/appuser/.aws && chown -R appuser:appuser /home/appuser/.aws

# Ensure the data directory is writable by the appuser
RUN chown -R appuser:appuser /app/data

USER appuser

# Expose the port the app runs on
EXPOSE 8000

# Make the startup script executable
COPY --chown=appuser:appuser backend/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Command to run the application
CMD ["/app/start.sh"]