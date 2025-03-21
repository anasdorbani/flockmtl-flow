import openai
import json
import time

from app.internal.database import conn
from app.dependencies import openai
from app.internal.database import get_table_schema
from app.internal.templates import SYSTEM_GENERATION_PROMPT, SYSTEM_TABLE_SELECTION, SYSTEM_PIPELINE_GENERATION, SYSTEM_PIPELINE_RUNNING

class PipelineGenerator:
    def __init__(self):
        """
        Initialize the PipelineGenerator with OpenAI API key and DuckDB connection.
        """
        self.openai = openai
        self.conn = conn

    def fetch_table_names(self):
        table_names = self.conn.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name NOT LIKE 'FLOCKMTL%';
        """).fetchall()
        
        table_names = [table_name[0] for table_name in table_names]
        
        return table_names
    
    def fetch_table_schema(self, table_name: str):
        table_schema = self.conn.execute("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = ?;
        """, (table_name,)).fetchall()
        
        return table_schema
    
    def select_table(self, prompt: str):
        table_names = self.fetch_table_names()

        table_prompt = SYSTEM_TABLE_SELECTION.format(table_names=table_names)

        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": table_prompt},
                {"role": "user", "content": prompt}
            ]
        )

        return response.choices[0].message.content
    
    def generate_query(self, prompt: str):
        
        table_name = self.select_table(prompt)
        
        generation_prompt = SYSTEM_GENERATION_PROMPT.format(table_name=table_name, table_schema=self.fetch_table_schema(table_name))
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    'role': 'system',
                    'content': generation_prompt
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ]   
        )
        
        return response.choices[0].message.content

    def generate_query_pipeline(self, query: str):
        
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    'role': 'system',
                    'content': SYSTEM_PIPELINE_GENERATION
                },
                {
                    'role': 'user',
                    'content': query
                }
            ],
            response_format={"type": "json_object"}
        )

        return json.loads(response.choices[0].message.content)

    def refine_query(self, query: str, pipeline: dict):
        
        table_name = self.select_table(query)
        
        generation_prompt = SYSTEM_GENERATION_PROMPT.format(table_name=table_name, table_schema=self.fetch_table_schema(table_name))
        
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    'role': 'system',
                    'content': generation_prompt
                },
                {
                    'role': 'system',
                    'content': SYSTEM_PIPELINE_RUNNING.format(pipeline=pipeline, user_query=query)
                }
            ]
        )

        return response.choices[0].message.content

    def execute_query(self, query: str):
        results = self.conn.execute(query)
        
        rows = results.fetchall()
        columns = [column[0] for column in results.description]
        
        data = [dict(zip(columns, row)) for row in rows]
        
        return data

    def pipeline_generation(self, prompt: str):
        query = self.generate_query(prompt)
        t_start = time.time()
        results = self.execute_query(query)
        t_end = time.time()
        pipeline = self.generate_query_pipeline(query)
        return {
            'prompt': prompt,
            'query': query,
            'pipeline': 
                {
                    'id': 0,
                    'name': 'Results',
                    'description': '',
                    'query_execution_time': t_end - t_start,
                    'is_function': False,
                    'params': {},
                    'data': results,
                    'children': [pipeline]
                }
        }
        
    def pipeline_running(self, pipeline: dict, query: str):
        new_query = self.refine_query(query, pipeline)
        t_start = time.time()
        results = self.execute_query(new_query)
        t_end = time.time()
        new_pipeline = self.generate_query_pipeline(new_query)
        return {
            'query': new_query,
            'pipeline': 
                {
                    'id': 0,
                    'name': 'Results',
                    'description': '',
                    'query_execution_time': t_end - t_start,
                    'is_function': False,
                    'params': {},
                    'data': results,
                    'children': [new_pipeline]
                }
        }