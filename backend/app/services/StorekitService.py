from app.integrations.StorekitClient import get_app_store_client
from app.models.SubscriptionModel import SubscriptionPlan
from decimal import Decimal

PRODUCT_PLAN_MAP = {
    "com.twintrades.app.monthly": (SubscriptionPlan.monthly, Decimal("15.00")),
    "com.twintrades.app.annual": (SubscriptionPlan.annual, Decimal("150.00")),
    "com.twintrades.app.lifetime": (SubscriptionPlan.lifetime, Decimal("450.00")),
}


class StorekitService:

    async def verify_transaction(self, transaction_id: str) -> dict:
        # Call the App Store Server API via StorekitClient to verify the transaction by ID.
        # Return the raw transaction info dict from Apple's response for the caller to process.
        # Raise BadRequestError if Apple returns an error or the transaction is not found.
        pass

    def map_product_to_plan(self, product_id: str) -> tuple[SubscriptionPlan, Decimal]:
        # Look up the product_id in PRODUCT_PLAN_MAP and return the (plan, amount) tuple.
        # Raise BadRequestError if the product_id is not one of the three known TwinTrades products.
        pass
