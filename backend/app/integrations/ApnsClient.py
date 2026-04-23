from app.helper.Config import settings


async def send_push(device_token: str, title: str, body: str, data: dict | None = None) -> None:
    # Build an APNs notification payload with the alert title, body, and optional custom data dict.
    # Connect to APNs using the private key at APNS_PRIVATE_KEY_PATH with APNS_KEY_ID and APNS_TEAM_ID.
    # Send to APNS_TOPIC (bundle ID) and log the APNs response code; raise on 400/403 errors, swallow 410 (unregistered).
    pass
