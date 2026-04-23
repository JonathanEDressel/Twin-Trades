from fastapi import FastAPI
from app.controllers import (
    AuthController, UserController, AdminController,
    PortfolioController, RebalanceController, SubscriptionController,
    BrokerageController, TradeController, WebhookController
)


def register_routes(app: FastAPI) -> None:
    app.include_router(AuthController.router)
    app.include_router(UserController.router)
    app.include_router(AdminController.router)
    app.include_router(PortfolioController.router)
    app.include_router(RebalanceController.router)
    app.include_router(SubscriptionController.router)
    app.include_router(BrokerageController.router)
    app.include_router(TradeController.router)
    app.include_router(WebhookController.router)
