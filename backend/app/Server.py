from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.helper.Config import settings
from app.helper.Logger import configure_logging
from app.helper.ErrorHandler import AppError, app_error_handler, unexpected_error_handler
from app.middleware.RateLimiters import limiter
from app.Routes import register_routes

from app.jobs.PendingRebalances import expire_pending_rebalances
from app.jobs.PortfolioSync import sync_portfolio_returns
from app.jobs.SubscriptionSync import sync_subscriptions
from app.jobs.SnapshotValues import snapshot_portfolio_values
from app.jobs.RefreshBrokerageTokens import refresh_expiring_tokens
from app.jobs.MonthlyReports import send_monthly_reports

from app.brokerages.Factory import BrokerageFactory
from app.brokerages.webull.Adapter import WebullAdapter
from app.brokerages.alpaca.Adapter import AlpacaAdapter
from app.brokerages.schwab.Adapter import SchwabAdapter

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()

    # Register brokerage adapters
    BrokerageFactory.register(WebullAdapter())
    BrokerageFactory.register(AlpacaAdapter())
    BrokerageFactory.register(SchwabAdapter())

    # Schedule cron jobs
    scheduler.add_job(expire_pending_rebalances, "interval", minutes=30, id="expire_rebalances")
    scheduler.add_job(sync_portfolio_returns, "interval", hours=1, id="portfolio_sync")
    scheduler.add_job(sync_subscriptions, "cron", hour=0, minute=0, id="subscription_sync")
    scheduler.add_job(snapshot_portfolio_values, "cron", hour=23, minute=59, id="snapshot_values")
    scheduler.add_job(refresh_expiring_tokens, "interval", hours=6, id="refresh_brokerage_tokens")
    scheduler.add_job(send_monthly_reports, "cron", day=1, hour=8, minute=0, id="monthly_reports")
    scheduler.start()

    yield

    scheduler.shutdown()


def create_app() -> FastAPI:
    app = FastAPI(
        title="TwinTrades API",
        version="1.0.0",
        docs_url="/docs" if settings.ENV != "production" else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(Exception, unexpected_error_handler)
    app.add_middleware(SlowAPIMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL] if settings.FRONTEND_URL else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_routes(app)
    return app


app = create_app()
