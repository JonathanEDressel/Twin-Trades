from app.helper.Logger import logger


async def send_monthly_reports() -> None:
    # On the 1st of each month at 08:00 UTC, compile the previous month's performance for each user.
    # Fetch each user's active portfolios, trade history, and return metrics from the DB.
    # Dispatch a formatted monthly report email via EmailService.send_monthly_report for each active subscriber.
    pass
