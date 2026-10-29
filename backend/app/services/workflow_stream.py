import asyncio
import json
import time
from typing import AsyncGenerator, Dict, Any

class WorkflowEventHub:
    """
    Coordinates and streams execution events across the multi-agent analysis pipeline
    for real-time frontend visualization via Server-Sent Events (SSE).
    """
    def __init__(self):
        self._listeners: Dict[str, asyncio.Queue] = {}

    def create_channel(self, analysis_id: str) -> asyncio.Queue:
        queue = asyncio.Queue()
        self._listeners[analysis_id] = queue
        return queue

    def remove_channel(self, analysis_id: str):
        if analysis_id in self._listeners:
            del self._listeners[analysis_id]

    async def emit(self, analysis_id: str, node_id: str, status: str, duration: str = "", summary: str = "", payload: Any = None):
        if analysis_id in self._listeners:
            event_data = {
                "analysisId": analysis_id,
                "nodeId": node_id,
                "status": status,
                "duration": duration,
                "summary": summary,
                "timestamp": time.time(),
                "payload": payload
            }
            await self._listeners[analysis_id].put(event_data)

workflow_hub = WorkflowEventHub()

async def event_generator(analysis_id: str) -> AsyncGenerator[str, None]:
    queue = workflow_hub.create_channel(analysis_id)
    try:
        while True:
            # Wait for next event
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield f"data: {json.dumps(event)}\n\n"
                if event.get("nodeId") == "report" and event.get("status") in ["completed", "failed"]:
                    break
            except asyncio.TimeoutError:
                # Keep-alive heartbeat
                yield f": heartbeat\n\n"
    finally:
        workflow_hub.remove_channel(analysis_id)
