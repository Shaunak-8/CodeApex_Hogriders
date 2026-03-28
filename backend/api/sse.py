import asyncio
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
import json
from datetime import datetime

router = APIRouter()

# Global event queues keyed by run_id
event_queues = {}

def get_queue(run_id: str):
    if run_id not in event_queues:
        event_queues[run_id] = asyncio.Queue()
    return event_queues[run_id]

def emit(run_id: str, agent: str, message: str, event_type: str = "thought"):
    """Emit an SSE event. Safe to call from sync code."""
    event = {
        "agent": agent,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "type": event_type,
    }
    if run_id in event_queues:
        try:
            # We need to get the running loop if it exists
            try:
                loop = asyncio.get_running_loop()
                loop.call_soon_threadsafe(event_queues[run_id].put_nowait, event)
            except RuntimeError:
                # No running loop, just put it (though this shouldn't happen in FastAPI)
                event_queues[run_id].put_nowait(event)
        except Exception as e:
            print(f"Emit error: {e}")

async def emit_async(run_id: str, agent: str, message: str, event_type: str = "thought"):
    """Emit an SSE event from async code."""
    event = {
        "agent": agent,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "type": event_type,
    }
    queue = get_queue(run_id)
    await queue.put(event)

@router.get("/stream/{run_id}")
async def stream(run_id: str):
    queue = get_queue(run_id)

    async def event_generator():
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield {"data": json.dumps(event)}
                if event.get("type") in ["RUN_COMPLETED", "RUN_FAILED", "error"]:
                    await asyncio.sleep(1.0) # Grace period for delivery
                    break
            except asyncio.TimeoutError:
                yield {"data": json.dumps({"type": "heartbeat", "message": "keepalive"})}

    return EventSourceResponse(event_generator())
