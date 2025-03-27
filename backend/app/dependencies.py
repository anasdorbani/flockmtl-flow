import os
import openai
from dotenv import load_dotenv
from app.internal.query_pipeline_manager import QueryPipelineManager
from app.internal.database import conn, get_table_schema

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

def get_openai_client():
    return openai

query_pipeline_manager = QueryPipelineManager()