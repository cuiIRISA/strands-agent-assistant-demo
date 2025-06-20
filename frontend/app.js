// API base URL - change this when deploying
const API_BASE_URL = 'http://localhost:8000/api';

// Global variables
let appointments = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
let selectedDate = new Date().toISOString().split('T')[0];

// Initialize tabs
document.addEventListener('DOMContentLoaded', () => {
    // Set up new appointment button
    document.getElementById('add-appointment').addEventListener('click', () => {
        // In a real implementation, this would open a modal
        // For now, we'll just use the chat interface
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.chat-container').forEach(c => c.classList.remove('active'));
        
        // Switch to chat tab
        document.querySelector('.tab[data-tab="personal"]').classList.add('active');
        document.getElementById('personal-chat').classList.add('active');
        
        // Pre-fill the input with a scheduling message
        const inputElement = document.getElementById('personal-input');
        inputElement.value = `Schedule an appointment on ${selectedDate}`;
        inputElement.focus();
    });
    // Set up tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and containers
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.chat-container').forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding container
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-chat`).classList.add('active');
        });
    });

    // Set up enter key for sending messages
    document.getElementById('personal-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage('personal');
        }
    });

    // Set up month navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 1) {
            currentMonth = 12;
            currentYear--;
        }
        fetchAppointments(currentYear, currentMonth);
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
        fetchAppointments(currentYear, currentMonth);
    });

    // Initial calendar render
    fetchAppointments(currentYear, currentMonth);
});

// Fetch appointments from API
function fetchAppointments(year, month) {
    fetch(`${API_BASE_URL}/appointments?year=${year}&month=${month}`)
        .then(response => response.json())
        .then(data => {
            appointments = data;
            renderCalendar(year, month);
        })
        .catch(error => {
            console.error('Error fetching appointments:', error);
        });
}

// Send message to API
function sendMessage(assistantType) {
    const inputElement = document.getElementById(`${assistantType}-input`);
    const message = inputElement.value.trim();

    if (!message) return;

    // Clear input
    inputElement.value = '';

    // Add user message to chat
    addMessage(assistantType, message, 'user');

    // Show typing indicator
    document.getElementById(`${assistantType}-typing`).style.display = 'flex';

    // Send message to API
    fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message
            // No need for assistant type since backend only uses personal_assistant_agent
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Hide typing indicator
            document.getElementById(`${assistantType}-typing`).style.display = 'none';

            if (data.error) {
                addMessage(assistantType, `Error: ${data.error}`, 'error');
            } else if (data.response) {
                addMessage(assistantType, data.response, 'assistant');

                // Refresh calendar data if this might have modified appointments
                if (message.toLowerCase().includes('appointment') ||
                    message.toLowerCase().includes('schedule') ||
                    message.toLowerCase().includes('meeting')) {
                    fetchAppointments(currentYear, currentMonth);
                }
            } else {
                addMessage(assistantType, 'Received empty response from server', 'error');
            }
        })
        .catch(error => {
            // Hide typing indicator
            document.getElementById(`${assistantType}-typing`).style.display = 'none';
            addMessage(assistantType, `Error: ${error.message}`, 'error');
        });
}

// Add message to chat
function addMessage(assistantType, text, sender) {
    const messagesContainer = document.getElementById(`${assistantType}-messages`);
    const messageElement = document.createElement('div');

    messageElement.classList.add('message');
    if (sender === 'user') {
        messageElement.classList.add('user-message');
        messageElement.textContent = text;
    } else if (sender === 'assistant') {
        messageElement.classList.add('assistant-message');

        // Format the message with markdown-like syntax
        let formattedText = text || '';

        // Convert code blocks (only if text contains code blocks)
        if (formattedText.includes('```')) {
            formattedText = formattedText.replace(/```([^`]+)```/g, '<pre>$1</pre>');
        }

        // Convert inline code (only if text contains inline code)
        if (formattedText.includes('`')) {
            formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
        }

        messageElement.innerHTML = formattedText;
    } else if (sender === 'error') {
        messageElement.classList.add('error-message');
        messageElement.textContent = text;
    }

    messagesContainer.appendChild(messageElement);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Clear chat
function clearChat(assistantType) {
    const messagesContainer = document.getElementById(`${assistantType}-messages`);
    messagesContainer.innerHTML = '';

    // Add welcome message back
    const welcomeMessage = document.createElement('div');
    welcomeMessage.classList.add('message', 'assistant-message');
    welcomeMessage.innerHTML = `
        <div style="font-weight: 600; font-size: 18px; margin-bottom: 10px;">🤖 Welcome to Your Personal Assistant!</div>
        <p>I'm here to help you manage your schedule and answer your questions. You can ask me to:</p>
        <ul style="padding-left: 20px; margin: 10px 0;">
            <li>📅 Schedule new appointments</li>
            <li>🗓 Check your calendar</li>
            <li>🔍 Get information on various topics</li>
            <li>📝 Take notes and reminders</li>
        </ul>
        <p>How can I assist you today?</p>
    `;
    messagesContainer.appendChild(welcomeMessage);
}

// Render calendar
function renderCalendar(year, month) {
    const monthYearElement = document.getElementById('month-year');
    const calendarGrid = document.querySelector('.calendar-grid');

    // Update month and year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearElement.textContent = `${monthNames[month - 1]} ${year}`;

    // Clear existing calendar days (except headers)
    const dayElements = calendarGrid.querySelectorAll('.calendar-day');
    dayElements.forEach(day => day.remove());

    // Get first day of month and number of days
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    // Get days from previous month
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

    // Add days from previous month
    for (let i = 0; i < firstDay; i++) {
        const day = daysInPrevMonth - firstDay + i + 1;
        addCalendarDay(calendarGrid, day, 'other-month', `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }

    // Add days for current month
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month - 1;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const classes = [];

        if (isCurrentMonth && day === today.getDate()) {
            classes.push('today');
        }

        if (dateStr === selectedDate) {
            classes.push('selected');
        }

        addCalendarDay(calendarGrid, day, classes.join(' '), dateStr);
    }

    // Add days from next month
    const totalCells = 42; // 6 rows of 7 days
    const remainingCells = totalCells - (firstDay + daysInMonth);

    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    for (let day = 1; day <= remainingCells; day++) {
        addCalendarDay(calendarGrid, day, 'other-month', `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }

    // Update appointments display
    updateDayAppointments(selectedDate);
}

// Add calendar day
function addCalendarDay(container, dayNumber, classes, dateStr) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('calendar-day');
    if (classes) {
        classes.split(' ').forEach(cls => {
            if (cls) dayElement.classList.add(cls);
        });
    }

    // Add day number
    const dayNumberElement = document.createElement('div');
    dayNumberElement.classList.add('day-number');
    dayNumberElement.textContent = dayNumber;
    dayElement.appendChild(dayNumberElement);

    // Add appointment indicators
    const dayAppointments = appointments.filter(apt => apt.date === dateStr);
    if (dayAppointments.length > 0) {
        // Add dots for each appointment (up to 3)
        const dotsContainer = document.createElement('div');
        dotsContainer.classList.add('appointment-dots');
        for (let i = 0; i < Math.min(dayAppointments.length, 3); i++) {
            const dot = document.createElement('span');
            dot.classList.add('appointment-dot');
            dotsContainer.appendChild(dot);
        }
        dayElement.appendChild(dotsContainer);

        // Sort appointments by time
        dayAppointments.sort((a, b) => a.time.localeCompare(b.time));
        
        // Add preview of first appointment
        if (dayAppointments.length > 0) {
            const preview = document.createElement('div');
            preview.classList.add('appointment-preview');
            preview.textContent = `${dayAppointments[0].time} ${dayAppointments[0].title}`;
            preview.setAttribute('data-title', `${dayAppointments[0].title} - ${dayAppointments[0].location || 'No location'}`); 
            dayElement.appendChild(preview);

            // Add second appointment preview if available
            if (dayAppointments.length > 1) {
                const preview2 = document.createElement('div');
                preview2.classList.add('appointment-preview');
                preview2.textContent = `${dayAppointments[1].time} ${dayAppointments[1].title}`;
                preview2.setAttribute('data-title', `${dayAppointments[1].title} - ${dayAppointments[1].location || 'No location'}`);
                dayElement.appendChild(preview2);
            }

            // Add indicator for more appointments
            if (dayAppointments.length > 2) {
                const moreIndicator = document.createElement('div');
                moreIndicator.classList.add('appointment-preview');
                moreIndicator.textContent = `+${dayAppointments.length - 2} more`;
                moreIndicator.style.fontStyle = 'italic';
                moreIndicator.style.opacity = '0.7';
                dayElement.appendChild(moreIndicator);
            }
        }
    }

    // Add click event
    dayElement.addEventListener('click', () => {
        // Remove selected class from all days
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });

        // Add selected class to this day
        dayElement.classList.add('selected');

        // Update selected date
        selectedDate = dateStr;

        // Update appointments display
        updateDayAppointments(dateStr);
    });

    container.appendChild(dayElement);
}

// Update day appointments
function updateDayAppointments(dateStr) {
    const appointmentsList = document.getElementById('appointments-list');
    const selectedDateElement = document.getElementById('selected-date');

    // Format the date for display
    const dateParts = dateStr.split('-');
    const formattedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    selectedDateElement.textContent = `Appointments for ${formattedDate.toLocaleDateString('en-US', options)}`;

    // Clear existing appointments
    appointmentsList.innerHTML = '';

    // Filter appointments for this date
    const dayAppointments = appointments.filter(apt => apt.date === dateStr);

    if (dayAppointments.length === 0) {
        const noAppointments = document.createElement('p');
        noAppointments.classList.add('no-appointments');
        noAppointments.textContent = 'No appointments for this day';
        appointmentsList.appendChild(noAppointments);
        return;
    }

    // Sort appointments by time
    dayAppointments.sort((a, b) => a.time.localeCompare(b.time));

    // Add each appointment
    dayAppointments.forEach(apt => {
        const appointmentItem = document.createElement('div');
        appointmentItem.classList.add('appointment-item');

        const timeElement = document.createElement('div');
        timeElement.classList.add('appointment-time');
        timeElement.textContent = apt.time;

        const titleElement = document.createElement('div');
        titleElement.classList.add('appointment-title');
        titleElement.textContent = apt.title;

        const detailsElement = document.createElement('div');
        detailsElement.classList.add('appointment-details');
        
        // Create location element with icon
        const locationDiv = document.createElement('div');
        locationDiv.innerHTML = `<i>📍</i> ${apt.location || 'No location'}`;
        
        // Create description element
        const descriptionDiv = document.createElement('div');
        descriptionDiv.innerHTML = `<i>📝</i> ${apt.description || 'No description'}`;
        
        // Create ID element
        const idDiv = document.createElement('div');
        idDiv.innerHTML = `<i>🆔</i> ${apt.id}`;
        
        // Add elements to details
        detailsElement.appendChild(locationDiv);
        detailsElement.appendChild(descriptionDiv);
        detailsElement.appendChild(idDiv);

        // Add action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('appointment-actions');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.justifyContent = 'flex-end';
        actionsDiv.style.gap = '10px';
        actionsDiv.style.marginTop = '10px';
        
        // Edit button
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.style.padding = '5px 15px';
        editButton.style.borderRadius = '20px';
        editButton.style.border = 'none';
        editButton.style.backgroundColor = 'var(--secondary-color)';
        editButton.style.color = 'white';
        editButton.style.cursor = 'pointer';
        editButton.style.fontWeight = '500';
        editButton.style.fontSize = '14px';
        editButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            // This would open an edit modal in a real implementation
            alert(`Edit appointment: ${apt.title}`);
        });
        
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.style.padding = '5px 15px';
        deleteButton.style.borderRadius = '20px';
        deleteButton.style.border = 'none';
        deleteButton.style.backgroundColor = 'var(--error-color)';
        deleteButton.style.color = 'white';
        deleteButton.style.cursor = 'pointer';
        deleteButton.style.fontWeight = '500';
        deleteButton.style.fontSize = '14px';
        deleteButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            // This would delete the appointment in a real implementation
            alert(`Delete appointment: ${apt.title}`);
        });
        
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);

        appointmentItem.appendChild(timeElement);
        appointmentItem.appendChild(titleElement);
        appointmentItem.appendChild(detailsElement);
        appointmentItem.appendChild(actionsDiv);

        appointmentsList.appendChild(appointmentItem);
    });
}