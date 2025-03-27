from fastapi import APIRouter, HTTPException, Body, Request
from pydantic import BaseModel
import openai
from app.dependencies import get_openai_client
from app.internal.database import execute_query, get_table_schema
from app.dependencies import query_pipeline_manager
from typing import Any, List, Dict

router = APIRouter()

# Define request model
class GeneratePipelineRequest(BaseModel):
    prompt: str

# Generate pipeline
@router.post("/generate-response-table")
async def generate_pipeline(request: GeneratePipelineRequest) -> Any:
    try:
        prompt = request.prompt
        return query_pipeline_manager.generate_response_table(prompt)

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

class GenerateQueryPlanRequest(BaseModel):
    query: str

@router.post("/generate-query-plan")
async def generate_query_plan(request: GenerateQueryPlanRequest) -> Any:
    try:
        query = request.query
        return query_pipeline_manager.generate_query_plan(query)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RegenerateResponseTableRequest(BaseModel):
    prompt: str
    generated_query: str

@router.post("/regenerate-response-table")
async def regenerate_response_table(request: RegenerateResponseTableRequest) -> Any:
    try:
        prompt = request.prompt
        generated_query = request.generated_query
        return query_pipeline_manager.regenerate_response_table(prompt, generated_query)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
class RunQueryWithRefinementRequest(BaseModel):
    query: str
    pipeline: Any
    
@router.post("/run-query-with-refinement")
async def run_query_with_refinement(request: RunQueryWithRefinementRequest) -> Any:
    try:
        query = request.query
        pipeline = request.pipeline
        return query_pipeline_manager.run_pipeline_with_refinement(query, pipeline)

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    
class GenerateInputQueryResponseTableRequest(BaseModel):
    query: str
    
@router.post("/generate-input-query-response-table")
async def generate_input_query_response_table(request: GenerateInputQueryResponseTableRequest) -> Any:
    try:
        query = request.query
        return query_pipeline_manager.generate_input_query_response_table(query)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/generate-plot-config")
async def generate_plot_config(request: Request) -> Any:
    try:
        body = await request.json()  # Directly parse the JSON request
        prompt = body.get("prompt")
        table = body.get("table")
        return query_pipeline_manager.generate_plot_config(prompt, table)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))