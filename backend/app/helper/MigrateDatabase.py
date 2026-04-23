from alembic.config import Config
from alembic import command


def run_migrations() -> None:
    # Load alembic.ini from the project root and run all pending migrations up to head.
    # Called on app startup in development; in production use the Alembic CLI instead.
    # Raises immediately if the DB is unreachable or a migration fails so startup aborts loudly.
    pass


def downgrade_one() -> None:
    # Roll back exactly one migration revision — for development and CI teardown only.
    # Guard-log before executing and refuse to run when ENV == "production".
    pass
