from app.helper.Logger import logger


async def snapshot_portfolio_values() -> None:
    # At 23:59 UTC each day, compute the total NAV for each active portfolio based on current prices.
    # Insert a PortfolioSnapshot row for each portfolio with the day's closing value.
    # These snapshots power the iOS Swift Charts performance graph on the portfolio detail screen.
    pass
