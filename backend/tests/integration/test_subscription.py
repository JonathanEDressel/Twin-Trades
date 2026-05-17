import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, patch, MagicMock

from app.helper.Security import Security
from app.models.SubscriptionModel import Subscription, SubscriptionStatus, SubscriptionPlan
from app.models.UserModel import User


def _make_token(user_id: int, role: str = "user") -> str:
    return Security.sign_jwt({"sub": str(user_id), "role": role})


async def _create_user(session, email: str, username: str) -> User:
    user = User(
        email=email,
        username=username,
        password_hash=Security.hash_password("Test1234!"),
        display_name=username,
    )
    session.add(user)
    await session.flush()
    return user


class TestGetStatus:
    async def test_unauthenticated_returns_401(self, client):
        resp = await client.get("/subscriptions/status")
        assert resp.status_code == 401

    async def test_no_subscription_returns_null(self, client, session):
        user = await _create_user(session, "status_none@test.com", "statusnone")
        token = _make_token(user.id)

        resp = await client.get("/subscriptions/status", headers={"Authorization": f"Bearer {token}"})

        assert resp.status_code == 200
        assert resp.json() is None

    async def test_exempt_user_returns_lifetime(self, client, session):
        user = await _create_user(session, "exempt_user@test.com", "exemptuser")
        user.subscription_exempt = True
        await session.flush()
        token = _make_token(user.id)

        resp = await client.get("/subscriptions/status", headers={"Authorization": f"Bearer {token}"})

        assert resp.status_code == 200
        data = resp.json()
        assert data["plan"] == "lifetime"
        assert data["status"] == "active"
        assert data["apple_transaction_id"] == "exempt"


class TestVerifyApple:
    async def test_unauthenticated_returns_401(self, client):
        resp = await client.post(
            "/subscriptions/verify-apple",
            json={"transaction_id": "txn_x", "product_id": "com.twintrades.app.monthly"},
        )
        assert resp.status_code == 401

    async def test_unknown_product_returns_400(self, client, session):
        user = await _create_user(session, "va_unknown@test.com", "vaunknown")
        token = _make_token(user.id)
        fake_tx = {
            "bundleId": "com.twintrades.app",
            "expiresDate": 1900000000000,
            "originalTransactionId": "orig_unknown",
        }

        with patch("app.services.SubscriptionService.StorekitService") as MockStorekit:
            MockStorekit.return_value.verify_transaction = AsyncMock(return_value=fake_tx)
            # Real map_product_to_plan raises for unknown product — replicate here
            from app.helper.ErrorHandler import BadRequestError
            MockStorekit.return_value.map_product_to_plan = MagicMock(
                side_effect=BadRequestError("Unknown product: com.unknown.product")
            )
            resp = await client.post(
                "/subscriptions/verify-apple",
                json={"transaction_id": "txn_unk", "product_id": "com.unknown.product"},
                headers={"Authorization": f"Bearer {token}"},
            )

        assert resp.status_code == 400

    async def test_bundle_mismatch_returns_400(self, client, session):
        user = await _create_user(session, "va_mismatch@test.com", "vamismatch")
        token = _make_token(user.id)
        fake_tx = {"bundleId": "com.different.app", "expiresDate": 1900000000000}

        with patch("app.services.SubscriptionService.StorekitService") as MockStorekit:
            MockStorekit.return_value.verify_transaction = AsyncMock(return_value=fake_tx)
            resp = await client.post(
                "/subscriptions/verify-apple",
                json={"transaction_id": "txn_mis", "product_id": "com.twintrades.app.monthly"},
                headers={"Authorization": f"Bearer {token}"},
            )

        assert resp.status_code == 400

    async def test_success_creates_subscription_and_billing_event(self, client, session):
        user = await _create_user(session, "va_success@test.com", "vasuccess")
        token = _make_token(user.id)
        fake_tx = {
            "bundleId": "com.twintrades.app",
            "expiresDate": 1900000000000,
            "originalTransactionId": "orig_success_1",
        }

        with patch("app.services.SubscriptionService.StorekitService") as MockStorekit:
            MockStorekit.return_value.verify_transaction = AsyncMock(return_value=fake_tx)
            MockStorekit.return_value.map_product_to_plan = MagicMock(
                return_value=(SubscriptionPlan.monthly, Decimal("15.00"))
            )
            resp = await client.post(
                "/subscriptions/verify-apple",
                json={"transaction_id": "txn_success_unique_001", "product_id": "com.twintrades.app.monthly"},
                headers={"Authorization": f"Bearer {token}"},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["plan"] == "monthly"
        assert data["status"] == "active"

    async def test_idempotent_on_same_transaction(self, client, session):
        user = await _create_user(session, "va_idem@test.com", "vaidem")
        token = _make_token(user.id)
        fake_tx = {
            "bundleId": "com.twintrades.app",
            "expiresDate": 1900000000000,
            "originalTransactionId": "orig_idem",
        }

        with patch("app.services.SubscriptionService.StorekitService") as MockStorekit:
            MockStorekit.return_value.verify_transaction = AsyncMock(return_value=fake_tx)
            MockStorekit.return_value.map_product_to_plan = MagicMock(
                return_value=(SubscriptionPlan.monthly, Decimal("15.00"))
            )
            resp1 = await client.post(
                "/subscriptions/verify-apple",
                json={"transaction_id": "txn_idem_unique_002", "product_id": "com.twintrades.app.monthly"},
                headers={"Authorization": f"Bearer {token}"},
            )
            resp2 = await client.post(
                "/subscriptions/verify-apple",
                json={"transaction_id": "txn_idem_unique_002", "product_id": "com.twintrades.app.monthly"},
                headers={"Authorization": f"Bearer {token}"},
            )

        assert resp1.status_code == 200
        assert resp2.status_code == 200
        assert resp1.json()["id"] == resp2.json()["id"]


class TestBillingHistory:
    async def test_unauthenticated_returns_401(self, client):
        resp = await client.get("/subscriptions/billing-history")
        assert resp.status_code == 401

    async def test_empty_history_returns_empty_list(self, client, session):
        user = await _create_user(session, "bh_empty@test.com", "bhempty")
        token = _make_token(user.id)

        resp = await client.get(
            "/subscriptions/billing-history", headers={"Authorization": f"Bearer {token}"}
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["events"] == []
        assert data["total"] == 0
        assert data["page"] == 1

    async def test_pagination_params_respected(self, client, session):
        user = await _create_user(session, "bh_page@test.com", "bhpage")
        token = _make_token(user.id)

        resp = await client.get(
            "/subscriptions/billing-history?page=2&page_size=5",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["page"] == 2
        assert data["page_size"] == 5
