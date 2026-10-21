import asyncio
import json
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.agents.workflow import live_event_subscribers

logger = logging.getLogger("sse_stream")
router = APIRouter(prefix="/stream", tags=["Live Telemetry & Agent SSE Stream"])

@router.get("/events")
async def sse_events_stream():
    """
    Server-Sent Events (SSE) streaming endpoint for live telemetry, 
    agent thought stream, and incident resolution events.
    Includes keep-alive heartbeat and guaranteed cleanup.
    """
    queue: asyncio.Queue = asyncio.Queue()
    live_event_subscribers.append(queue)

    async def event_generator():
        try:
            # Send initial connection handshake
            yield f"data: {json.dumps({'event_type': 'CONNECTED', 'message': 'Subscribed to Autonomous SRE Live Event Stream'})}\n\n"
            while True:
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {json.dumps(data)}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat ping to prevent proxies/browsers timing out
                    yield ": ping\n\n"
        except asyncio.CancelledError:
            logger.info("SSE client connection closed.")
        except Exception as e:
            logger.warning(f"SSE client error: {e}")
        finally:
            if queue in live_event_subscribers:
                live_event_subscribers.remove(queue)
            logger.info("SSE client cleaned up from subscribers.")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
