import httpx
from decimal import Decimal
from urllib.parse import urlencode
from app.helper.Config import settings
from app.helper.ErrorHandler import BadRequestError, UnauthorizedError


class WebullClient:
    """Raw HTTP client for the Webull brokerage API. No encryption/decryption here."""

    BASE_URL = "https://api.webull.com/api"
    AUTH_URL = "https://api.webull.com/api/oauth2/authorize"
    TOKEN_URL = "https://api.webull.com/api/oauth2/token"
    REVOKE_URL = "https://api.webull.com/api/oauth2/token/revoke"

    def get_auth_url(self, state: str) -> str:
        params = urlencode({
            "app_key": settings.WEBULL_APP_KEY,
            "redirect_uri": settings.WEBULL_REDIRECT_URI,
            "response_type": "code",
            "scope": "trade",
            "state": state,
        })
        return f"{self.AUTH_URL}?{params}"

    async def exchange_code(self, code: str) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(self.TOKEN_URL, json={
                "grant_type": "authorization_code",
                "code": code,
                "app_key": settings.WEBULL_APP_KEY,
                "app_secret": settings.WEBULL_APP_SECRET,
                "redirect_uri": settings.WEBULL_REDIRECT_URI,
            })
        if resp.status_code >= 400:
            raise BadRequestError(f"Webull token exchange failed: {resp.text}")
        data = resp.json()
        return {
            "access_token": data["access_token"],
            "refresh_token": data.get("refresh_token"),
            "expires_in": data.get("expires_in"),
            "account_id": data.get("account_id"),
        }

    async def refresh_token(self, refresh_token: str) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(self.TOKEN_URL, json={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "app_key": settings.WEBULL_APP_KEY,
                "app_secret": settings.WEBULL_APP_SECRET,
            })
        if resp.status_code == 401:
            raise UnauthorizedError("Webull refresh token expired or revoked")
        if resp.status_code >= 400:
            raise BadRequestError(f"Webull token refresh failed: {resp.text}")
        data = resp.json()
        return {
            "access_token": data["access_token"],
            "refresh_token": data.get("refresh_token"),
            "expires_in": data.get("expires_in"),
        }

    async def revoke_token(self, access_token: str) -> None:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(self.REVOKE_URL, json={
                    "token": access_token,
                    "app_key": settings.WEBULL_APP_KEY,
                })
        except Exception:
            pass  # Swallow all errors — token may already be expired

    async def place_order(self, access_token: str, ticker: str, action: str, quantity: Decimal) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{self.BASE_URL}/paper-trade/orders",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "action": action.upper(),
                    "tickerSymbol": ticker,
                    "orderType": "MKT",
                    "quantity": str(quantity),
                    "timeInForce": "DAY",
                },
            )
        if resp.status_code >= 400:
            raise BadRequestError(f"Webull order failed: {resp.text}")
        data = resp.json()
        return {
            "broker_order_id": str(data.get("orderId", "")),
            "status": data.get("status", "unknown"),
            "filled_price": Decimal(str(data["filledPrice"])) if data.get("filledPrice") else None,
        }

    async def get_positions(self, access_token: str) -> list[dict]:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self.BASE_URL}/portfolio/openpositions",
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code >= 400:
            raise BadRequestError(f"Webull positions fetch failed: {resp.text}")
        positions = resp.json().get("positions", [])
        return [
            {
                "ticker": p["ticker"]["symbol"],
                "quantity": Decimal(str(p.get("position", 0))),
                "market_value": Decimal(str(p.get("marketValue", 0))),
            }
            for p in positions
        ]
