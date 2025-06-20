import os
from strands import Agent, tool
from strands.models import BedrockModel
from strands_tools import current_time
from calendar_tools import create_appointment, get_agenda, list_appointments, update_appointment
from constants import SESSION_ID

# Show rich UI for tools in CLI
os.environ["STRANDS_TOOL_CONSOLE_MODE"] = "enabled"


@tool
def calendar_assistant(query: str) -> str:
    """
    Calendar assistant agent to manage appointments.
    Args:
        query: A request to the calendar assistant

    Returns:
        Output from interaction
    """
    # Call the agent and return its response
    response = agent(query)
    print("\n\n")
    return str(response)


system_prompt = """You are a helpful calendar assistant that specializes in managing my appointments. 
You have access to appointment management tools, and can check the current time to help me organize my schedule effectively. 
Always provide the appointment id so that I can update it if required"""

model = BedrockModel(
    model_id = "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
)

agent = Agent(
    model=model,
    system_prompt=system_prompt,
    tools=[
        current_time,
        create_appointment,
        list_appointments,
        update_appointment,
        get_agenda
    ],
    trace_attributes={"session.id": SESSION_ID},
)