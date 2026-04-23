from decimal import Decimal
from app.brokerages.Base import IBrokerageAdapter
from app.brokerages.webull.Client import WebullClient
from app.helper.Security import Security


class WebullAdapter(IBrokerageAdapter):
    SLUG = "webull"
    IS_AVAILABLE = True

    def __init__(self):
        self.client = WebullClient()

    def get_auth_url(self, state: str) -> str:
        # Delegate directly to WebullClient.get_auth_url — no token decryption needed here.
        pass

    async def exchange_code(self, code: str) -> dict:
        # Delegate to WebullClient.exchange_code and return the raw token dict to the caller.
        # Encryption of the returned tokens is the caller's (BrokerageService) responsibility.
        pass

    async def refresh_token(self, refresh_token_enc: str) -> dict:
        # Decrypt the encrypted refresh token via Security.decrypt_brokerage_token.
        # Delegate to WebullClient.refresh_token with the plaintext token.
        # Return the new token dict — caller must re-encrypt and save.
        pass

    async def revoke_token(self, access_token_enc: str) -> None:
        # Decrypt the encrypted access token and call WebullClient.revoke_token.
        # Decryption and API call are the only operations in this method.
        pass

    async def place_order(self, access_token_enc: str, ticker: str, action: str, quantity: Decimal) -> dict:
        # Decrypt the access token and delegate to WebullClient.place_order.
        # Return the order result dict; never expose the plaintext token outside this method.
        pass

    async def get_positions(self, access_token_enc: str) -> list[dict]:
        # Decrypt the access token and delegate to WebullClient.get_positions.
        # Return the positions list; the plaintext token must not be logged or returned.
        pass
