import os
import openai
from dotenv import load_dotenv
from app.internal.pipeline_generator import PipelineGenerator
from app.internal.database import conn, get_table_schema

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

def get_openai_client():
    return openai

pipeline_generator = PipelineGenerator()