from app.helper.Logger import logger


async def sync_portfolio_returns() -> None:
    # For each active portfolio, fetch current market prices and recalculate total_return_pct.
    # Update the total_return_pct column on the portfolio row and insert a PortfolioSnapshot row.
    # Runs hourly via APScheduler; log elapsed time and any per-portfolio errors without aborting the full run.
    pass
