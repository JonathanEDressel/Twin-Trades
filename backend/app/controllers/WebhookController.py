from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.schemas.Subscription import AppleWebhookPayload

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/apple")
async def apple_notifications(request: Request, body: AppleWebhookPayload, session: AsyncSession = Depends(get_session)):
    # Decode and verify the signedPayload JWT using Apple's public keys from the App Store Server API.
    # Extract the notificationType and subtype to determine what subscription event occurred.
    # Delegate to SubscriptionService.handle_apple_notification to update the user's subscription status.
    pass
