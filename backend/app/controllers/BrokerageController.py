from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.middleware.RateLimiters import brokerage_auth_limiter, api_limiter
from app.schemas.Brokerage import BrokerageConnectionResponse, OAuthInitiateResponse, OAuthCallbackPayload

router = APIRouter(prefix="/brokerages", tags=["brokerages"])


@router.get("/connections", response_model=list[BrokerageConnectionResponse])
async def list_connections(current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Return all active brokerage connections for the authenticated user.
    # Omit encrypted token fields — return only metadata (slug, account_id, expires_at).
    # Return empty list if the user has no connected brokerages.
    pass


@router.post("/oauth/initiate", response_model=OAuthInitiateResponse)
async def initiate_oauth(brokerage_slug: str, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Generate the OAuth authorization URL for the requested brokerage via BrokerageService.
    # Persist a short-lived state token in the DB to prevent CSRF on the callback.
    # Raise BadRequestError if brokerage_slug is not a registered adapter.
    pass


@router.post("/oauth/callback")
async def oauth_callback(body: OAuthCallbackPayload, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Validate the state token, exchange the authorization code for tokens via BrokerageService.
    # Encrypt the access and refresh tokens with AES-256-GCM before writing to brokerage_connections.
    # Raise BadRequestError if state mismatch, code is invalid, or brokerage API returns an error.
    pass


@router.delete("/connections/{connection_id}")
async def disconnect(connection_id: int, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Revoke the brokerage tokens via the adapter's revoke_token method before deleting the row.
    # Set is_active = False on the connection row; do not hard-delete for audit trail.
    # Raise NotFoundError if connection_id does not belong to the authenticated user.
    pass
