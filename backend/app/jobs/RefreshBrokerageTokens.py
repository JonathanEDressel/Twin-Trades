from app.helper.Logger import logger


async def refresh_expiring_tokens() -> None:
    # Query brokerage_connections where token_expires_at < now() + 1 hour and is_active = True.
    # For each connection, call the appropriate adapter's refresh_token method and save the new encrypted tokens.
    # Runs every 6 hours; log successes and failures separately — a failed refresh should not abort the batch.
    pass
