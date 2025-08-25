import logging
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routers import pipeline, data
from app.dependencies import get_system_status

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app with metadata
app = FastAPI(
    title="FlockMTL Flow API",
    description="Backend API for FlockMTL Flow - AI-powered data analysis with dynamic table management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pipeline.router, tags=["pipeline"])
app.include_router(data.router, prefix="/data", tags=["data"])


@app.get("/", summary="Root endpoint", description="Basic health check endpoint")
async def root():
    """Root endpoint providing basic API information and health status."""
    try:
        system_status = get_system_status()
        return {
            "message": "FlockMTL Flow API is running!",
            "version": "1.0.0",
            "status": "healthy" if "error" not in system_status else "degraded",
            "system_status": system_status,
        }
    except Exception as e:
        logger.error(f"Error in root endpoint: {e}")
        return {
            "message": "FlockMTL Flow API is running with issues",
            "version": "1.0.0",
            "status": "error",
            "error": str(e),
        }


@app.get(
    "/health", summary="Health check", description="Detailed health check endpoint"
)
async def health_check():
    """Comprehensive health check endpoint for monitoring and debugging."""
    try:
        system_status = get_system_status()

        # Determine overall health
        is_healthy = all(
            [
                "error" not in system_status,
                system_status.get("database", {}).get("connection_ready", False),
                system_status.get("pipeline_manager_ready", False),
            ]
        )

        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "timestamp": int(time.time()),
            "checks": {
                "database": system_status.get("database", {}).get(
                    "connection_ready", False
                ),
                "flockmtl": system_status.get("database", {}).get(
                    "flockmtl_available", False
                ),
                "openai": system_status.get("openai_configured", False),
                "pipeline_manager": system_status.get("pipeline_manager_ready", False),
            },
            "details": system_status,
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")


@app.on_event("startup")
async def startup_event():
    """Application startup event handler."""
    logger.info("Starting FlockMTL Flow API...")

    try:
        system_status = get_system_status()
        logger.info("System status at startup:")
        logger.info(
            f"  - Database ready: {system_status.get('database', {}).get('connection_ready', False)}"
        )
        logger.info(
            f"  - FlockMTL available: {system_status.get('database', {}).get('flockmtl_available', False)}"
        )
        logger.info(
            f"  - OpenAI configured: {system_status.get('openai_configured', False)}"
        )
        logger.info(
            f"  - Pipeline manager ready: {system_status.get('pipeline_manager_ready', False)}"
        )

        if system_status.get("environment", {}).get("load_sample_data"):
            logger.info("  - Sample data loading: ENABLED")

        logger.info("FlockMTL Flow API startup completed successfully")

    except Exception as e:
        logger.error(f"Error during startup: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event handler."""
    logger.info("Shutting down FlockMTL Flow API...")
    # Add any cleanup operations here if needed
    logger.info("FlockMTL Flow API shutdown completed")
