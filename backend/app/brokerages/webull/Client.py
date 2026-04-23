import httpx
from decimal import Decimal
from app.helper.Config import settings


class WebullClient:
    """Raw HTTP client for the Webull brokerage API. No encryption/decryption here."""

    BASE_URL = "https://api.webull.com/api"

    def get_auth_url(self, state: str) -> str:
        # Build and return the Webull OAuth authorization URL with client_id, redirect_uri, and state params.
        # Use settings.WEBULL_APP_KEY and settings.WEBULL_REDIRECT_URI for the query parameters.
        pass

    async def exchange_code(self, code: str) -> dict:
        # POST to Webull's token endpoint with the authorization code and client credentials.
        # Parse and return the token response dict; raise BadRequestError if the API returns an error.
        pass

    async def refresh_token(self, refresh_token: str) -> dict:
        # POST to Webull's token refresh endpoint with the raw (decrypted) refresh token.
        # Return a new token dict; raise UnauthorizedError if the refresh token is expired or revoked.
        pass

    async def revoke_token(self, access_token: str) -> None:
        # POST to Webull's token revocation endpoint with the raw access token.
        # Silently swallow 4xx errors — the token may already be expired.
        pass

    async def place_order(self, access_token: str, ticker: str, action: str, quantity: Decimal) -> dict:
        # Submit a market order to Webull's orders API with the given parameters.
        # Return a dict with broker_order_id, status, and filled_price (Decimal or None).
        pass

    async def get_positions(self, access_token: str) -> list[dict]:
        # GET the user's current account positions from Webull's positions endpoint.
        # Return a list of dicts with keys: ticker, quantity (Decimal), market_value (Decimal).
        pass
