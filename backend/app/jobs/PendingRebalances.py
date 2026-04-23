from app.helper.Logger import logger


async def expire_pending_rebalances() -> None:
    # Fetch all RebalanceEvent rows where status = "pending_confirmation" and expires_at < now().
    # Set their status to "expired" via RebalanceDbContext.set_status for each batch.
    # Log the count of expired events at INFO level; this job runs every 30 minutes via APScheduler.
    pass
