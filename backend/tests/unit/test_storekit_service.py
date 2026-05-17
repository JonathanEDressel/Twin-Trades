import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.StorekitService import StorekitService
from app.models.SubscriptionModel import SubscriptionPlan
from app.helper.ErrorHandler import BadRequestError


class TestMapProductToPlan:
    def test_monthly(self):
        plan, amount = StorekitService().map_product_to_plan("com.twintrades.app.monthly")
        assert plan == SubscriptionPlan.monthly
        assert amount == Decimal("15.00")

    def test_annual(self):
        plan, amount = StorekitService().map_product_to_plan("com.twintrades.app.annual")
        assert plan == SubscriptionPlan.annual
        assert amount == Decimal("150.00")

    def test_lifetime(self):
        plan, amount = StorekitService().map_product_to_plan("com.twintrades.app.lifetime")
        assert plan == SubscriptionPlan.lifetime
        assert amount == Decimal("450.00")

    def test_unknown_raises(self):
        with pytest.raises(BadRequestError) as exc:
            StorekitService().map_product_to_plan("com.other.app.pro")
        assert "Unknown product" in exc.value.message


class TestVerifyTransaction:
    async def test_returns_decoded_claims(self):
        fake_claims = {
            "transactionId": "txn_1",
            "bundleId": "com.twintrades.app",
            "productId": "com.twintrades.app.monthly",
            "expiresDate": 1900000000000,
            "originalTransactionId": "orig_1",
        }
        mock_response = MagicMock(signedTransactionInfo="a.b.c")
        mock_client = MagicMock(get_transaction_info=MagicMock(return_value=mock_response))

        with (
            patch("app.services.StorekitService.get_app_store_client", new_callable=AsyncMock, return_value=mock_client),
            patch("app.services.StorekitService.jose_jwt.get_unverified_claims", return_value=fake_claims),
        ):
            result = await StorekitService().verify_transaction("txn_1")

        assert result["bundleId"] == "com.twintrades.app"
        assert result["transactionId"] == "txn_1"

    async def test_apple_error_raises_bad_request(self):
        mock_client = MagicMock(
            get_transaction_info=MagicMock(side_effect=RuntimeError("Apple API down"))
        )

        with patch("app.services.StorekitService.get_app_store_client", new_callable=AsyncMock, return_value=mock_client):
            with pytest.raises(BadRequestError) as exc:
                await StorekitService().verify_transaction("bad_txn")
            assert "could not verify" in exc.value.message
