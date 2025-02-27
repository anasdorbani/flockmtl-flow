from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
from app.dependencies import get_openai_client
from app.internal.database import execute_query, get_table_schema
from app.dependencies import pipeline_generator

router = APIRouter(
    prefix="/pipeline",
    tags=["pipeline"]
)

# Request models
class GeneratePipelineRequest(BaseModel):
    prompt: str

class RegeneratePipelineRequest(BaseModel):
    pipeline: dict

# Generate pipeline
@router.post("/generate-pipeline")
async def generate_pipeline(request: GeneratePipelineRequest):
    try:
        openai_client = get_openai_client()
        
        generated_pipeline = pipeline_generator.generate_pipeline(request.prompt)

        return {"pipeline": generated_pipeline}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Regenerate pipeline
@router.post("/regenerate-pipeline")
async def regenerate_pipeline(request: RegeneratePipelineRequest):
    try:
        openai_client = get_openai_client()

        response = openai_client.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "system", "content": "You regenerate pipelines."},
                      {"role": "user", "content": str(request.pipeline)}]
        )

        regenerated_pipeline = response["choices"][0]["message"]["content"]

        return {"regenerated_pipeline": regenerated_pipeline}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
