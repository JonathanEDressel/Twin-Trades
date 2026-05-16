import base64
import hashlib
import hmac
import json
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from urllib.parse import urlencode, quote

import httpx

from app.helper.Config import settings
from app.helper.ErrorHandler import BadRequestError, UnauthorizedError


class WebullClient:
    """
    HTTP client for the Webull Connect API (OAuth 2.0).

    OAuth endpoints:
      - Auth redirect:  {base}/oauth2/authenticate/login
      - Token exchange: {base}/openapi/oauth2/token

    Credentials provided by Webull after registering at developer.webull.com:
      client_id / client_secret  — OAuth2 grant credentials
      app_key   / app_secret     — HMAC-SHA1 request-signing keys

    UAT (test) environment: WEBULL_USE_UAT=true in .env
    Production environment:  WEBULL_USE_UAT=false (default)

    Docs: https://developer.webull.com/apis/docs/connect-api/about-connect-api
    """

    _PROD_BASE = "https://us-oauth-open-api.webull.com"
    _UAT_BASE  = "https://us-oauth-open-api.uat.webullbroker.com"

    AUTH_PATH  = "/oauth2/authenticate/login"
    TOKEN_PATH = "/openapi/oauth2/token"

    def __init__(self) -> None:
        self.base_url = self._UAT_BASE if settings.WEBULL_USE_UAT else self._PROD_BASE

    # ── Request signing ────────────────────────────────────────────────────────

    def _now_iso8601(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    def _base_sign_headers(self) -> dict:
        """Return the set of headers that participate in the HMAC-SHA1 signature."""
        return {
            "x-app-key":             settings.WEBULL_APP_KEY,
            "x-timestamp":           self._now_iso8601(),
            "x-signature-version":   "1.0",
            "x-signature-algorithm": "HMAC-SHA1",
            "x-signature-nonce":     uuid.uuid4().hex,
            "x-version":             "v2",
        }

    def _compute_signature(
        self,
        path: str,
        sign_headers: dict,
        query_params: dict | None = None,
        json_body: dict | None = None,
    ) -> str:
        """
        Webull HMAC-SHA1 canonical signature (mirrors the official SDK).

        canonical = url_encode(
            path
            + "&" + "&".join(sorted(lower_key=value pairs of sign-headers + Host + query_params))
            + ["&" + MD5_HEX_UPPER(JSON(json_body))]   # only for JSON request bodies
        )
        signature = base64( HMAC-SHA1(canonical, app_secret + "&") )
        """
        host = self.base_url.replace("https://", "")

        # x-version is sent as a header but NOT included in the signature
        sign_params: dict[str, str] = {
            k.lower(): str(v)
            for k, v in sign_headers.items()
            if k != "x-version"
        }
        sign_params["host"] = host

        if query_params:
            for k, v in query_params.items():
                key = k.lower()
                existing = sign_params.get(key)
                sign_params[key] = f"{existing}&{v}" if existing else str(v)

        body_part = ""
        if json_body is not None:
            raw = json.dumps(json_body, separators=(",", ":"), sort_keys=True)
            body_part = "&" + hashlib.md5(raw.encode()).hexdigest().upper()

        sorted_pairs = "&".join(f"{k}={v}" for k, v in sorted(sign_params.items()))
        string_to_sign = f"{path}&{sorted_pairs}{body_part}"
        quoted = quote(string_to_sign, safe="")

        key = (settings.WEBULL_APP_SECRET + "&").encode()
        sig = hmac.new(key, quoted.encode(), hashlib.sha1)
        return base64.b64encode(sig.digest()).decode().strip()

    def _signed_headers(self, path: str, extra: dict | None = None, json_body: dict | None = None) -> dict:
        h = self._base_sign_headers()
        h["x-signature"] = self._compute_signature(path, h, json_body=json_body)
        if extra:
            h.update(extra)
        return h

    # ── OAuth flow ─────────────────────────────────────────────────────────────

    def get_auth_url(self, state: str) -> str:
        """
        Build the browser redirect URL for the user to log in and authorise access.
        Redirect to this URL — the user is sent to Webull's login page (H5).
        After granting access Webull redirects back to WEBULL_REDIRECT_URI with
        ?code=...&state=...
        """
        params = urlencode({
            "client_id":    settings.WEBULL_CLIENT_ID,
            "response_type": "code",
            "scope":        "user:trade:wr",
            "state":        state,
            "redirect_uri": settings.WEBULL_REDIRECT_URI,
        })
        return f"{self.base_url}{self.AUTH_PATH}?{params}"

    async def exchange_code(self, code: str) -> dict:
        """Exchange an authorization code for access + refresh tokens."""
        headers = self._signed_headers(
            self.TOKEN_PATH,
            extra={"Content-Type": "application/x-www-form-urlencoded"},
        )
        body = urlencode({
            "client_id":     settings.WEBULL_CLIENT_ID,
            "client_secret": settings.WEBULL_CLIENT_SECRET,
            "grant_type":    "authorization_code",
            "code":          code,
        })
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{self.base_url}{self.TOKEN_PATH}",
                content=body,
                headers=headers,
            )
        if resp.status_code >= 400:
            raise BadRequestError(f"Webull token exchange failed: {resp.text}")
        data = resp.json()
        return {
            "access_token":  data["access_token"],
            "refresh_token": data.get("refresh_token"),
            # expires_in is in seconds; Webull access tokens live 30 min (1800 s)
            "expires_in":    int(data.get("expires_in", 1800)),
            # identity_id is the Webull user identifier stored as account_id
            "account_id":    data.get("identity_id"),
        }

    async def refresh_token(self, refresh_token: str) -> dict:
        """Obtain a new access token using a refresh token (valid 15 days)."""
        headers = self._signed_headers(
            self.TOKEN_PATH,
            extra={"Content-Type": "application/x-www-form-urlencoded"},
        )
        body = urlencode({
            "client_id":     settings.WEBULL_CLIENT_ID,
            "client_secret": settings.WEBULL_CLIENT_SECRET,
            "grant_type":    "refresh_token",
            "refresh_token": refresh_token,
        })
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{self.base_url}{self.TOKEN_PATH}",
                content=body,
                headers=headers,
            )
        if resp.status_code == 401:
            raise UnauthorizedError("Webull refresh token expired or revoked")
        if resp.status_code >= 400:
            raise BadRequestError(f"Webull token refresh failed: {resp.text}")
        data = resp.json()
        return {
            "access_token":  data["access_token"],
            "refresh_token": data.get("refresh_token"),
            "expires_in":    int(data.get("expires_in", 1800)),
        }

    async def revoke_token(self, access_token: str) -> None:
        """
        The Webull Connect API does not expose a token revocation endpoint.
        Tokens expire naturally (access: 30 min, refresh: 15 days).
        This is a no-op; the caller (BrokerageService) handles deactivation in the DB.
        """

    # ── Trading ────────────────────────────────────────────────────────────────

    async def place_order(self, access_token: str, ticker: str, action: str, quantity: Decimal) -> dict:
        """
        Place a market order via the Connect API.

        Paper trading uses WEBULL_PAPER_TRADING=true (default).
        For live trading set WEBULL_PAPER_TRADING=false — no code changes needed.

        TODO: Connect API trading endpoint paths are subject to change during UAT;
        update BASE_URL + path once production credentials are obtained.
        """
        order_path = "paper-trade/orders" if settings.WEBULL_PAPER_TRADING else "v1/trade/orders"
        body = {
            "action":      action.upper(),
            "tickerSymbol": ticker,
            "orderType":   "MKT",
            "quantity":    str(quantity),
            "timeInForce": "DAY",
        }
        headers = self._signed_headers(f"/{order_path}", json_body=body)
        headers["Authorization"] = f"Bearer {access_token}"
        headers["Content-Type"]  = "application/json"

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{self.base_url}/{order_path}",
                json=body,
                headers=headers,
            )
        if resp.status_code >= 400:
            raise BadRequestError(f"Webull order failed: {resp.text}")
        data = resp.json()
        return {
            "broker_order_id": str(data.get("orderId", "")),
            "status":          data.get("status", "unknown"),
            "filled_price":    Decimal(str(data["filledPrice"])) if data.get("filledPrice") else None,
        }

    async def get_positions(self, access_token: str) -> list[dict]:
        """Fetch open positions for the connected account."""
        path = "/openapi/account/asset"
        headers = self._signed_headers(path)
        headers["Authorization"] = f"Bearer {access_token}"

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{self.base_url}{path}", headers=headers)
        if resp.status_code >= 400:
            raise BadRequestError(f"Webull positions fetch failed: {resp.text}")
        positions = resp.json().get("positions", [])
        return [
            {
                "ticker":       p["ticker"]["symbol"],
                "quantity":     Decimal(str(p.get("position", 0))),
                "market_value": Decimal(str(p.get("marketValue", 0))),
            }
            for p in positions
        ]

