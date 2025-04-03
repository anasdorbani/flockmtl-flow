import openai
import json
import time

from app.internal.database import conn
from app.dependencies import openai
from app.internal.database import get_table_schema
from app.internal.templates import SYSTEM_GENERATION_PROMPT, SYSTEM_TABLE_SELECTION, SYSTEM_PIPELINE_GENERATION, SYSTEM_PIPELINE_RUNNING, SYSTEM_PLOT_CONFIG


class QueryPipelineManager:
    def __init__(self):
        """
        Initializes the QueryPipelineManager with OpenAI API and DuckDB connection.
        """
        self.openai = openai
        self.conn = conn

    def fetch_table_names(self):
        """
        Fetches the list of table names from the database, excluding those starting with 'FLOCKMTL'.
        """
        table_names = self.conn.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name NOT LIKE 'FLOCKMTL%';
        """).fetchall()
        return [table_name[0] for table_name in table_names]

    def fetch_table_schema(self, table_name: list[str]):
        """
        Fetches the schema (columns and data types) of a specific table.
        """
        table_schemas = []
        for name in table_name:
            table_schema = self.conn.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = ?;
            """, (name,)).fetchall()
            table_schemas.append({
                    'table_name': name,
                    'schema': [
                        {
                            'column_name': column[0],
                            'data_type': column[1]
                        } for column in table_schema
                    ]
                })
        return table_schemas

    def choose_table_based_on_prompt(self, prompt: str):
        """
        Selects the appropriate table based on the user's prompt.
        """
        table_names = self.fetch_table_names()
        table_selection_prompt = SYSTEM_TABLE_SELECTION.format(table_names=table_names)
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": table_selection_prompt},
                {"role": "user", "content": prompt}
            ]
        )

        return eval(response.choices[0].message.content)

    def generate_sql_query(self, prompt: str):
        """
        Generates an SQL query based on the user's prompt and the selected table schema.
        """
        table_name = self.choose_table_based_on_prompt(prompt)
        table_schema = self.fetch_table_schema(table_name)

        generation_prompt = SYSTEM_GENERATION_PROMPT.format(table_name=table_name, table_schema=table_schema)
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": generation_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    
    def regenerate_sql_query(self, prompt: str, generated_query: str):
        """
        Regenerates an SQL query based on the user's prompt and the generated query.
        """
        table_name = self.choose_table_based_on_prompt(prompt)
        table_schema = self.fetch_table_schema(table_name)

        generation_prompt = SYSTEM_GENERATION_PROMPT.format(table_name=table_name, table_schema=table_schema)
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": generation_prompt},
                {"role": "system", "content": "The User will provide you with the generated query and the prompt and your need to regenerate the query, make sure that the query is much clear and generates a well structured table."},
                {"role": "user", "content": prompt},
                {"role": "user", "content": generated_query}
            ]
        )
        return response.choices[0].message.content

    def generate_pipeline_for_query(self, query: str):
        """
        Generates a query execution pipeline based on the SQL query.
        """
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PIPELINE_GENERATION},
                {"role": "user", "content": query}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

    def execute_sql_query(self, query: str):
        """
        Executes the SQL query on the database and returns the results.
        """
        results = self.conn.execute(query)
        rows = results.fetchall()
        columns = [column[0] for column in results.description]
        return [dict(zip(columns, row)) for row in rows]

    def generate_response_table(self, prompt: str):
        """
        Generates a response table based on the user's prompt.
        """
        query = self.generate_sql_query(prompt)
        time_start = time.time()
        table = self.execute_sql_query(query)
        time_end = time.time()
        return {
            'prompt': prompt,
            'query': query,
            'table': table,
            'execution_time': round(time_end - time_start, 3)
        }
    
    def generate_input_query_response_table(self, query: str):
        """
        Generates a response table based on the user's query.
        """
        time_start = time.time()
        table = self.execute_sql_query(query)
        time_end = time.time()
        return {
            'query': query,
            'table': table,
            'execution_time': round(time_end - time_start, 3)
        }
        
    def generate_query_plan(self, query: str):
        """
        Generates a query plan based on the user's query.
        """
        pipeline = self.generate_pipeline_for_query(query)
        return {
            'query': query,
            'pipeline': pipeline
        }
    
    def regenerate_response_table(self, prompt: str, generated_query: str):
        """
        Regenerates the response table based on the user's prompt and the generated query.
        """
        query = self.regenerate_sql_query(prompt, generated_query)
        time_start = time.time()
        table = self.execute_sql_query(query)
        time_end = time.time()
        return {
            'prompt': prompt,
            'query': query,
            'table': table,
            'execution_time': round(time_end - time_start)
        }

    def refine_query_based_on_pipeline(self, query: str, pipeline: dict):
        """
        Refines the SQL query based on the pipeline and user prompt.
        """
        table_name = self.choose_table_based_on_prompt(query)
        table_schema = self.fetch_table_schema(table_name)

        generation_prompt = SYSTEM_GENERATION_PROMPT.format(table_name=table_name, table_schema=table_schema)
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": generation_prompt},
                {"role": "system", "content": SYSTEM_PIPELINE_RUNNING.format(pipeline=pipeline, user_query=query)}
            ]
        )
        
        return response.choices[0].message.content

    def run_pipeline_with_refinement(self, query: str, pipeline: dict):
        """
        Runs the pipeline by refining the query based on the pipeline and re-executing it.
        """
        new_query = self.refine_query_based_on_pipeline(query, pipeline)
        time_start = time.time()
        table = self.execute_sql_query(new_query)
        time_end = time.time()

        new_pipeline = self.generate_pipeline_for_query(new_query)
        return {
            'query': new_query,
            'table': table,
            'execution_time': round(time_end - time_start),
            'pipeline': new_pipeline
        }
        
    def generate_plot_config(self, prompt: str, table: any):
        """
        Generates a plot configuration based on the user's prompt and the table data.
        """
        
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PLOT_CONFIG.format(user_data=table, user_prompt=prompt)}
            ],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
