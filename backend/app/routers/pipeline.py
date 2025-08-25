import logging
from typing import Any
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.dependencies import query_pipeline_manager

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response Models
class GeneratePipelineRequest(BaseModel):
    prompt: str
    selected_tables: list[str] = []


class GenerateQueryPlanRequest(BaseModel):
    query: str


class RegenerateResponseTableRequest(BaseModel):
    prompt: str
    generated_query: str
    selected_tables: list[str] = []


class RunQueryWithRefinementRequest(BaseModel):
    query: str
    pipeline: Any


class GenerateInputQueryResponseTableRequest(BaseModel):
    query: str


class TestQueryRequest(BaseModel):
    query: str


# Main Pipeline Endpoints
@router.post("/generate-response-table")
async def generate_pipeline(request: GeneratePipelineRequest) -> Any:
    """Generate and execute a response table from a natural language prompt."""
    try:
        logger.info(f"Generating response table for prompt: {request.prompt[:100]}...")
        logger.info(f"Selected tables: {request.selected_tables}")
        result = query_pipeline_manager.generate_response_table(
            request.prompt, request.selected_tables
        )
        logger.info("Response table generated successfully")
        return result

    except Exception as e:
        error_msg = f"Pipeline generation failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/generate-query-plan")
async def generate_query_plan(request: GenerateQueryPlanRequest) -> Any:
    """Generate a query execution plan from a query string."""
    try:
        logger.info(f"Generating query plan for: {request.query[:100]}...")
        result = query_pipeline_manager.generate_query_plan(request.query)
        logger.info("Query plan generated successfully")
        return result

    except Exception as e:
        error_msg = f"Query plan generation failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/regenerate-response-table")
async def regenerate_response_table(request: RegenerateResponseTableRequest) -> Any:
    """Regenerate a response table based on prompt and previous query."""
    try:
        logger.info(
            f"Regenerating response table for prompt: {request.prompt[:100]}..."
        )
        result = query_pipeline_manager.regenerate_response_table(
            request.prompt, request.generated_query, request.selected_tables
        )
        logger.info("Response table regenerated successfully")
        return result

    except Exception as e:
        error_msg = f"Response table regeneration failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/run-query-with-refinement")
async def run_query_with_refinement(request: RunQueryWithRefinementRequest) -> Any:
    """Run a query with pipeline refinement."""
    try:
        logger.info(f"Running query with refinement: {request.query[:100]}...")
        result = query_pipeline_manager.run_pipeline_with_refinement(
            request.query, request.pipeline
        )
        logger.info("Query with refinement executed successfully")
        return result

    except Exception as e:
        error_msg = f"Query refinement execution failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/generate-input-query-response-table")
async def generate_input_query_response_table(
    request: GenerateInputQueryResponseTableRequest,
) -> Any:
    """Generate response table from direct query input."""
    try:
        logger.info(f"Generating input query response for: {request.query[:100]}...")
        result = query_pipeline_manager.generate_input_query_response_table(
            request.query
        )
        logger.info("Input query response generated successfully")
        return result

    except Exception as e:
        error_msg = f"Input query response generation failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/generate-plot-config")
async def generate_plot_config(request: Request) -> Any:
    """Generate plot configuration from prompt and table data."""
    try:
        body = await request.json()
        prompt = body.get("prompt")
        table = body.get("table")

        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
        if not table:
            raise HTTPException(status_code=400, detail="Table data is required")

        logger.info(f"Generating plot config for prompt: {prompt[:100]}...")
        result = query_pipeline_manager.generate_plot_config(prompt, table)
        logger.info("Plot configuration generated successfully")
        return result

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        error_msg = f"Plot config generation failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


# Debug Endpoints
@router.get("/debug/info")
async def get_debug_info() -> Any:
    """Get current debug information from the query pipeline manager."""
    try:
        debug_info = query_pipeline_manager.get_debug_info()
        logger.debug("Debug info retrieved successfully")
        return {
            "debug_info": debug_info,
            "status": "success",
        }
    except Exception as e:
        error_msg = f"Failed to get debug info: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/debug/clear")
async def clear_debug_info() -> Any:
    """Clear debug information."""
    try:
        query_pipeline_manager.clear_debug_info()
        logger.info("Debug info cleared successfully")
        return {"status": "debug info cleared"}
    except Exception as e:
        error_msg = f"Failed to clear debug info: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/debug/test-query")
async def test_query_execution(request: TestQueryRequest) -> Any:
    """Test query execution with detailed debug information."""
    try:
        logger.info(f"Testing query execution: {request.query[:100]}...")

        # Clear previous debug info
        query_pipeline_manager.clear_debug_info()

        # Execute query with debug info
        result = query_pipeline_manager.execute_sql_query(request.query)

        logger.info("Query test executed successfully")
        return {
            "query": request.query,
            "result": result,
            "debug_info": query_pipeline_manager.get_debug_info(),
            "status": "success",
        }
    except Exception as e:
        error_msg = f"Query test failed: {str(e)}"
        logger.error(error_msg)
        return {
            "query": request.query,
            "result": None,
            "debug_info": query_pipeline_manager.get_debug_info(),
            "error": error_msg,
            "status": "error",
        }


@router.post("/debug/test-generation")
async def test_query_generation(request: GeneratePipelineRequest) -> Any:
    """Test query generation with detailed debug information."""
    try:
        logger.info(f"Testing query generation: {request.prompt[:100]}...")

        # Clear previous debug info
        query_pipeline_manager.clear_debug_info()

        # Generate query with debug info
        generated_query = query_pipeline_manager.generate_sql_query(request.prompt)

        logger.info("Query generation test completed successfully")
        return {
            "prompt": request.prompt,
            "generated_query": generated_query,
            "debug_info": query_pipeline_manager.get_debug_info(),
            "status": "success",
        }
    except Exception as e:
        error_msg = f"Query generation test failed: {str(e)}"
        logger.error(error_msg)
        return {
            "prompt": request.prompt,
            "generated_query": None,
            "debug_info": query_pipeline_manager.get_debug_info(),
            "error": error_msg,
            "status": "error",
        }
