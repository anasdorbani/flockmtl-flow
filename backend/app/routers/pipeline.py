from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
from app.dependencies import get_openai_client
from app.internal.database import execute_query, get_table_schema
from app.dependencies import pipeline_generator
from typing import Any

router = APIRouter(
    prefix="/pipeline",
    tags=["pipeline"]
)

# Request models
class GeneratePipelineRequest(BaseModel):
    prompt: str

class PipelineRunningRequest(BaseModel):
    pipeline: Any
    query: str

# Generate pipeline
@router.post("/generate-pipeline")
async def generate_pipeline(request: GeneratePipelineRequest):
    try:
        
        prompt = request.prompt
        
        return pipeline_generator.pipeline_generation(prompt)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Regenerate pipeline
@router.post("/pipeline-running")
async def pipeline_running(request: PipelineRunningRequest):
    try:
        pipeline = request.pipeline
        query = request.query
        print(pipeline)
     
        return pipeline_generator.pipeline_running(pipeline, query)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
