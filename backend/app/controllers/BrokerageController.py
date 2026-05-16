from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.middleware.RateLimiters import brokerage_auth_limiter, api_limiter
from app.schemas.Brokerage import BrokerageConnectionResponse, OAuthInitiateResponse, OAuthCallbackPayload, OAuthInitiatePayload
from app.controllers.BrokerageDbContext import BrokerageDbContext
from app.services.BrokerageService import BrokerageService
from app.brokerages.Factory import BrokerageFactory
from app.helper.ErrorHandler import NotFoundError, ForbiddenError

router = APIRouter(prefix="/brokerages", tags=["brokerages"])


@router.get("/available", response_model=list[str])
async def list_available(_current_user=Depends(get_current_user)):
    return BrokerageFactory.list_available()


@router.get("/connections", response_model=list[BrokerageConnectionResponse])
async def list_connections(current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    return await BrokerageDbContext(session).find_by_user(current_user.id)


@router.post("/oauth/initiate", response_model=OAuthInitiateResponse)
async def initiate_oauth(body: OAuthInitiatePayload, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    svc = BrokerageService(session)
    return await svc.initiate_oauth(current_user.id, body.brokerage_slug)


@router.post("/oauth/callback", response_model=BrokerageConnectionResponse)
async def oauth_callback(body: OAuthCallbackPayload, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    svc = BrokerageService(session)
    conn = await svc.handle_oauth_callback(current_user.id, body.brokerage_slug, body.code, body.state)
    return conn


@router.delete("/connections/{connection_id}")
async def disconnect(connection_id: int, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await BrokerageService(session).disconnect(current_user.id, connection_id)
    return {"message": "Brokerage disconnected"}
