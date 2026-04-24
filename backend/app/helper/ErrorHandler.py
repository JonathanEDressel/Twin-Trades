import traceback
from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, msg: str = "Not found"):
        super().__init__(404, msg)


class ForbiddenError(AppError):
    def __init__(self, msg: str = "Forbidden"):
        super().__init__(403, msg)


class UnauthorizedError(AppError):
    def __init__(self, msg: str = "Unauthorized"):
        super().__init__(401, msg)


class BadRequestError(AppError):
    def __init__(self, msg: str = "Bad request"):
        super().__init__(400, msg)


class ConflictError(AppError):
    def __init__(self, msg: str = "Conflict"):
        super().__init__(409, msg)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})


async def unexpected_error_handler(request: Request, exc: Exception) -> JSONResponse:
    # Log the full traceback and request context to error_logs table via AdminDbContext.
    # Never expose the raw exception message or stack trace to the client response.
    # Return a generic 500 message to avoid leaking implementation details.
    return JSONResponse(status_code=500, content={"error": "An unexpected error occurred"})
