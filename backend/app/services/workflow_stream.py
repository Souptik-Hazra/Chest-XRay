import asyncio
import json
import time
from collections import defaultdict
from typing import Any, AsyncGenerator, Dict, List


class WorkflowEventHub:
    """In-memory event log with replay for SSE clients that connect late."""
    def __init__(self, history_limit: int = 100):
        self._listeners: Dict[str, List[asyncio.Queue]] = defaultdict(list)
        self._history: Dict[str, List[dict]] = defaultdict(list)
        self._history_limit = history_limit

    def emit_nowait(self, analysis_id: str, node_id: str, status: str,
                    duration: float | None = None, summary: str = "", payload: Any = None):
        event = {"analysisId": analysis_id, "nodeId": node_id, "status": status,
                 "duration": duration, "summary": summary, "timestamp": time.time(), "payload": payload}
        history = self._history[analysis_id]
        history.append(event)
        del history[:-self._history_limit]
        for queue in tuple(self._listeners.get(analysis_id, [])):
            queue.put_nowait(event)

    async def subscribe(self, analysis_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._listeners[analysis_id].append(queue)
        for event in self._history.get(analysis_id, []):
            queue.put_nowait(event)
        return queue

    def unsubscribe(self, analysis_id: str, queue: asyncio.Queue):
        listeners = self._listeners.get(analysis_id, [])
        if queue in listeners:
            listeners.remove(queue)
        if not listeners:
            self._listeners.pop(analysis_id, None)


workflow_hub = WorkflowEventHub()


async def event_generator(analysis_id: str) -> AsyncGenerator[str, None]:
    queue = await workflow_hub.subscribe(analysis_id)
    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=20.0)
                yield f"data: {json.dumps(event)}\n\n"
                if event.get("nodeId") == "report" and event.get("status") in {"completed", "failed"}:
                    break
            except asyncio.TimeoutError:
                yield ": heartbeat\n\n"
    finally:
        workflow_hub.unsubscribe(analysis_id, queue)
