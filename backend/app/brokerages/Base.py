from abc import ABC, abstractmethod
from decimal import Decimal


class IBrokerageAdapter(ABC):
    """Abstract base class that every brokerage integration must implement."""

    SLUG: str           # e.g. "webull"
    IS_AVAILABLE: bool  # False for stubs not yet implemented

    @abstractmethod
    def get_auth_url(self, state: str) -> str:
        """Return the OAuth authorization URL to redirect the user to."""
        ...

    @abstractmethod
    async def exchange_code(self, code: str) -> dict:
        """Exchange an authorization code for access + refresh tokens.

        Returns a dict with keys: access_token, refresh_token, expires_in, account_id.
        """
        ...

    @abstractmethod
    async def refresh_token(self, refresh_token_enc: str) -> dict:
        """Use the encrypted refresh token to obtain a new access token.

        Decrypts the token internally and returns the same dict shape as exchange_code.
        """
        ...

    @abstractmethod
    async def revoke_token(self, access_token_enc: str) -> None:
        """Revoke the access token at the brokerage. May be a no-op for some brokers."""
        ...

    @abstractmethod
    async def place_order(self, access_token_enc: str, ticker: str, action: str, quantity: Decimal) -> dict:
        """Submit a market order.

        Returns a dict with keys: broker_order_id, status, filled_price (Decimal | None).
        All monetary values must use Decimal — never float.
        """
        ...

    @abstractmethod
    async def get_positions(self, access_token_enc: str) -> list[dict]:
        """Return current account positions.

        Each item: {"ticker": str, "quantity": Decimal, "market_value": Decimal}.
        """
        ...
