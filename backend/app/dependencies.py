import os
import logging
import openai
from dotenv import load_dotenv
from app.internal.query_pipeline_manager import QueryPipelineManager
from app.internal.db_manager import get_database_info

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

# Configure OpenAI API
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key and openai_api_key.strip() and openai_api_key != "test-key":
    openai.api_key = openai_api_key
    logger.info("OpenAI API key configured successfully")
else:
    logger.warning("OpenAI API key not found or invalid")


def get_openai_client():
    """
    Get OpenAI client with proper configuration validation.

    Returns:
        openai module if properly configured

    Raises:
        RuntimeError: If OpenAI API key is not configured
    """
    if not openai.api_key:
        raise RuntimeError("OpenAI API key is not configured")
    return openai


# Create global query pipeline manager
try:
    query_pipeline_manager = QueryPipelineManager()
    logger.info("Query pipeline manager initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize query pipeline manager: {e}")
    raise


def get_query_pipeline_manager() -> QueryPipelineManager:
    """
    Get the global query pipeline manager instance.

    Returns:
        QueryPipelineManager instance
    """
    return query_pipeline_manager


def get_system_status():
    """
    Get comprehensive system status for health checks.

    Returns:
        Dictionary with system status information
    """
    try:
        return {
            "database": get_database_info(),
            "openai_configured": bool(openai.api_key),
            "pipeline_manager_ready": query_pipeline_manager is not None,
            "environment": {
                "load_sample_data": os.getenv("LOAD_SAMPLE_DATA", "false").lower()
                == "true",
                "has_openai_key": bool(
                    openai_api_key and openai_api_key.strip() != "test-key"
                ),
            },
        }
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        return {"error": str(e), "status": "error"}
