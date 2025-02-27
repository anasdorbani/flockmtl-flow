import openai
import json

from app.internal.database import conn
from app.dependencies import openai
from app.internal.database import get_table_schema

class PipelineGenerator:
    def __init__(self):
        """
        Initialize the PipelineGenerator with OpenAI API key and DuckDB connection.
        """
        self.openai = openai
        self.conn = conn
        self.table_schema = get_table_schema("employees")

    def expand_prompt(self, prompt: str):
        """
        Generates alternative prompt variations using OpenAI.
        """
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Generate three alternative versions of the given query."},
                {"role": "user", "content": f"""
Provide alternative ways to phrase: '{prompt}'.
The output should be a list like this:
[
    "Alternative 1",
    "Alternative 2",
    ...
]

"""}
            ]
        )
        return eval(response.choices[0].message.content)

    def generate_data_filtering_query(self, prompt: str, prompt_expansion: list):
        """
        Generates an SQL query to filter data based on the prompt.
        """
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Generate an SQL query to filter data based on a given prompt."},
                {"role": "user", "content": f"""
Generate an SQL query for: '{prompt}' using the employees table schema {self.table_schema}.

here's the prompt expansion: {prompt_expansion}

make sure that your are using a simple SQL query that can be executed on any database.

The output should be a json in the next format:
{{
    "prompt": "<a new prompt that would directly generate the query>",
    "query": "<generated query>"
}}
"""}
            ],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)

    def generate_insights_extraction_query(self, prompt: str, prompt_expansion: list, data_filtering_query: dict, raw_data: list):
        """
        Generates an SQL query to extract meaningful insights from the filtered data.
        """
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Generate an SQL query to transform filtered data into insights."},
                {"role": "user", "content": f"""
Generate an insights SQL query for: '{prompt}'  using the employees table schema {self.table_schema}.

here's the prompt expansion: {prompt_expansion}

here's the data filtering query: {data_filtering_query}

here's the raw data: {raw_data}

make sure that the new prompt is different from all the previous ones.

make sure that your are using a simple SQL query that can be executed on any database.

The output should be a json in the next format:
{{
    "prompt": "<a new prompt that would directly generate the query>",
    "query": "<generated query>"
}}
"""}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

    def execute_query(self, query: str):
        """
        Executes the given SQL query on the DuckDB database.
        """
        try:
            result = self.conn.execute(query).fetchall()
            return result
        except Exception as e:
            return str(e)

    def generate_final_results(self, prompt: str, insights_extraction_query: dict, data: list):
        """
        Generates the final insights table with a summary.
        """
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Summarize and format the final results in a structured JSON output."},
                {"role": "user", "content": f"""Create a structured JSON output for: '{prompt}' based on data {data}.
The output should be a json in the next format:

{{
    "summary": "<summary of the insights in plain text>",
}}
"""}
            ],
            response_format={"type": "json_object"}
        )
        results = json.loads(response.choices[0].message.content)
        results["data"] = data
        return results

    def generate_pipeline(self, prompt: str):
        """
        Generates the full pipeline step by step.
        """
        print(f"Generating pipeline for prompt: {prompt}")
        prompt_expansion = self.expand_prompt(prompt)
        print(f"Prompt expansion: {prompt_expansion}")
        data_filtering_query = self.generate_data_filtering_query(prompt, prompt_expansion)
        print(f"Data filtering query: {data_filtering_query}")
        raw_data = self.execute_query(data_filtering_query["query"])
        print(raw_data)
        insights_extraction_query = self.generate_insights_extraction_query(prompt, prompt_expansion, data_filtering_query, raw_data)

        # Execute SQL Queries
        insights_data = self.execute_query(insights_extraction_query["query"])

        # Generate Final Results
        final_results = self.generate_final_results(prompt, insights_extraction_query, insights_data)

        pipeline = {
            "prompt": prompt,
            "prompt_expansion": prompt_expansion,
            "data_filtering": data_filtering_query,
            "insights_extraction": insights_extraction_query,
            "final_results": final_results
        }

        return pipeline
