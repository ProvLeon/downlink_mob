from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import formats, health, info, merge, stream


def create_app() -> FastAPI:
    app = FastAPI(
        title="Downlink API",
        description="Backend extraction service for the Downlink mobile app",
        version="1.0.0",
        docs_url="/docs",
    )

    # CORS — allow the mobile app and any local dev origin
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Tighten to your domain in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(health.router, tags=["Health"])
    app.include_router(info.router, prefix="/api", tags=["Info"])
    app.include_router(formats.router, prefix="/api", tags=["Formats"])
    app.include_router(stream.router, prefix="/api", tags=["Stream"])
    app.include_router(merge.router, prefix="/api", tags=["Merge"])

    return app
