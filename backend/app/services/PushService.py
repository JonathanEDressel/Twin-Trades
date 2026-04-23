from app.integrations.ApnsClient import send_push


class PushService:

    async def send(self, device_token: str, title: str, body: str, data: dict | None = None) -> None:
        # Dispatch a single APNs push notification to the given device token via ApnsClient.send_push.
        # Include the data payload (e.g., {"event_id": 42}) for deep-link handling on the iOS side.
        # Log failure silently — a push delivery failure must never abort the calling business logic.
        pass

    async def send_bulk(self, device_tokens: list[str], title: str, body: str, data: dict | None = None) -> dict:
        # Send the same push notification to a list of device tokens concurrently using asyncio.gather.
        # Return a dict with keys: sent (int), failed (int) for logging by the caller.
        # Failed tokens should be collected and can be cleaned up by the caller if desired.
        pass
