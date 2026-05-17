import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.SubscriptionService import SubscriptionService
from app.models.SubscriptionModel import Subscription, SubscriptionStatus, SubscriptionPlan
from app.helper.ErrorHandler import BadRequestError


class TestIsActive:
    async def test_exempt_user_skips_db_and_returns_true(self, session):
        mock_user = MagicMock(subscription_exempt=True)
        with patch("app.services.SubscriptionService.UserDbContext") as MockUserDb:
            MockUserDb.return_value.find_by_id = AsyncMock(return_value=mock_user)
            result = await SubscriptionService(session).is_active(1)
        assert result is True

    async def test_missing_subscription_returns_false(self, session):
        mock_user = MagicMock(subscription_exempt=False)
        with (
            patch("app.services.SubscriptionService.UserDbContext") as MockUserDb,
            patch("app.services.SubscriptionService.SubscriptionDbContext") as MockSubDb,
        ):
            MockUserDb.return_value.find_by_id = AsyncMock(return_value=mock_user)
            MockSubDb.return_value.find_active_for_user = AsyncMock(return_value=None)
            result = await SubscriptionService(session).is_active(1)
        assert result is False

    async def test_lifetime_subscription_with_null_expires_returns_true(self, session):
        mock_user = MagicMock(subscription_exempt=False)
        mock_sub = MagicMock(expires_at=None)
        with (
            patch("app.services.SubscriptionService.UserDbContext") as MockUserDb,
            patch("app.services.SubscriptionService.SubscriptionDbContext") as MockSubDb,
        ):
            MockUserDb.return_value.find_by_id = AsyncMock(return_value=mock_user)
            MockSubDb.return_value.find_active_for_user = AsyncMock(return_value=mock_sub)
            result = await SubscriptionService(session).is_active(1)
        assert result is True


class TestVerifyAppleTransaction:
    async def test_success_monthly(self, session):
        fake_tx = {
            "bundleId": "com.twintrades.app",
            "expiresDate": 1900000000000,
            "originalTransactionId": "orig_1",
        }
        mock_sub = MagicMock(spec=Subscription, id=42)

        with (
            patch("app.services.SubscriptionService.StorekitService") as MockStorekit,
            patch("app.services.SubscriptionService.SubscriptionDbContext") as MockSubDb,
            patch("app.services.SubscriptionService.UserDbContext"),
        ):
            MockStorekit.return_value.verify_transaction = AsyncMock(return_value=fake_tx)
            MockStorekit.return_value.map_product_to_plan = MagicMock(
                return_value=(SubscriptionPlan.monthly, Decimal("15.00"))
            )
            MockSubDb.return_value.upsert_by_transaction_id = AsyncMock(return_value=mock_sub)
            MockSubDb.return_value.insert_billing_event = AsyncMock()

            result = await SubscriptionService(session).verify_apple_transaction(
                1, "txn_1", "com.twintrades.app.monthly"
            )

        assert result is mock_sub
        MockSubDb.return_value.upsert_by_transaction_id.assert_called_once()
        MockSubDb.return_value.insert_billing_event.assert_called_once()

    async def test_bundle_id_mismatch_raises(self, session):
        fake_tx = {"bundleId": "com.other.app"}

        with patch("app.services.SubscriptionService.StorekitService") as MockStorekit:
            MockStorekit.return_value.verify_transaction = AsyncMock(return_value=fake_tx)
            with pytest.raises(BadRequestError) as exc:
                await SubscriptionService(session).verify_apple_transaction(
                    1, "txn_1", "com.twintrades.app.monthly"
                )
        assert "does not belong" in exc.value.message

    async def test_lifetime_has_null_expires_at(self, session):
        fake_tx = {
            "bundleId": "com.twintrades.app",
            "expiresDate": None,
            "originalTransactionId": "orig_lt",
        }
        mock_sub = MagicMock(spec=Subscription, id=99)

        with (
            patch("app.services.SubscriptionService.StorekitService") as MockStorekit,
            patch("app.services.SubscriptionService.SubscriptionDbContext") as MockSubDb,
            patch("app.services.SubscriptionService.UserDbContext"),
        ):
            MockStorekit.return_value.verify_transaction = AsyncMock(return_value=fake_tx)
            MockStorekit.return_value.map_product_to_plan = MagicMock(
                return_value=(SubscriptionPlan.lifetime, Decimal("450.00"))
            )
            MockSubDb.return_value.upsert_by_transaction_id = AsyncMock(return_value=mock_sub)
            MockSubDb.return_value.insert_billing_event = AsyncMock()

            await SubscriptionService(session).verify_apple_transaction(
                1, "txn_lt", "com.twintrades.app.lifetime"
            )

        # expires_at should be None for lifetime
        call_kwargs = MockSubDb.return_value.upsert_by_transaction_id.call_args.kwargs
        assert call_kwargs["expires_at"] is None
        assert call_kwargs["plan"] == SubscriptionPlan.lifetime
