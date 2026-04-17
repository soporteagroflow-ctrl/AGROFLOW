import os
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.cors import CORSMiddleware

from app.dependencies import client, limiter
from app.routers import audit, auth, animals, exports, finances, insights, paddocks, photos, seed, sync


def _allowed_origins() -> list[str]:
    """Read allowed CORS origins from the ALLOWED_ORIGINS env var.

    Defaults to localhost for dev. Wildcard ``*`` combined with credentials
    is rejected by browsers and is insecure, so never default to it.
    """
    raw = os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:8081,http://localhost:19006",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing to do right now
    yield
    # Shutdown: close the Mongo client
    client.close()


def create_app() -> FastAPI:
    app = FastAPI(title="AgroFlow API", version="2.0.0", lifespan=lifespan)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    api_router = APIRouter(prefix="/api")
    api_router.include_router(auth.router)
    api_router.include_router(animals.router)
    api_router.include_router(paddocks.router)
    api_router.include_router(finances.router)
    api_router.include_router(insights.router)
    api_router.include_router(sync.router)
    api_router.include_router(seed.router)
    api_router.include_router(photos.router)
    api_router.include_router(exports.router)
    api_router.include_router(audit.router)
    app.include_router(api_router)

    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origins=_allowed_origins(),
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    return app
