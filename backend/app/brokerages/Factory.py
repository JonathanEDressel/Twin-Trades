from app.brokerages.Base import IBrokerageAdapter

_registry: dict[str, IBrokerageAdapter] = {}


class BrokerageFactory:

    @staticmethod
    def register(adapter: IBrokerageAdapter) -> None:
        # Add the adapter instance to the _registry dict keyed by adapter.SLUG.
        # Raise ValueError if an adapter for that slug is already registered to prevent accidental overwrites.
        pass

    @staticmethod
    def get(slug: str) -> IBrokerageAdapter:
        # Return the registered adapter for the given slug.
        # Raise BadRequestError if the slug is not found in the registry.
        pass

    @staticmethod
    def list_available() -> list[str]:
        # Return a sorted list of registered adapter slugs where IS_AVAILABLE = True.
        # Used by the /admin/brokerages endpoint to show which integrations are live.
        pass
