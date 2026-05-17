import asyncio
from decimal import Decimal

from jose import jwt as jose_jwt
from app.integrations.StorekitClient import get_app_store_client
from app.models.SubscriptionModel import SubscriptionPlan
from app.helper.ErrorHandler import BadRequestError

PRODUCT_PLAN_MAP = {
    "com.twintrades.app.monthly": (SubscriptionPlan.monthly, Decimal("15.00")),
    "com.twintrades.app.annual": (SubscriptionPlan.annual, Decimal("150.00")),
    "com.twintrades.app.lifetime": (SubscriptionPlan.lifetime, Decimal("450.00")),
}


class StorekitService:

    async def verify_transaction(self, transaction_id: str) -> dict:
        """Call the App Store Server API and return the decoded transaction claims.

        The signed JWT in the response is decoded without re-verifying Apple's
        signature — the response is already authenticated via TLS + API key auth,
        so signature re-verification would require bundling Apple root certs.
        """
        client = await get_app_store_client()
        try:
            response = await asyncio.to_thread(client.get_transaction_info, transaction_id)
        except Exception as exc:
            raise BadRequestError("Apple could not verify the transaction") from exc
        claims: dict = jose_jwt.get_unverified_claims(response.signedTransactionInfo)
        return claims

    def map_product_to_plan(self, product_id: str) -> tuple[SubscriptionPlan, Decimal]:
        if product_id not in PRODUCT_PLAN_MAP:
            raise BadRequestError(f"Unknown product: {product_id}")
        return PRODUCT_PLAN_MAP[product_id]
