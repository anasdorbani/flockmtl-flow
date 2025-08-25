import json
import time
import logging
import traceback
import os
from dotenv import load_dotenv
import openai

from app.internal.database import conn, get_all_tables, get_table_schema
from app.internal.db_manager import is_flockmtl_available, get_database_info
from app.internal.templates import (
    SYSTEM_GENERATION_PROMPT,
    SYSTEM_TABLE_SELECTION,
    SYSTEM_PIPELINE_GENERATION,
    SYSTEM_PIPELINE_RUNNING,
    SYSTEM_PLOT_CONFIG,
)

# Load environment variables and set up OpenAI
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Set up detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class QueryPipelineManager:
    """
    Manages query pipeline operations with improved error handling and logging.

    This class handles:
    1. Table selection based on user prompts
    2. SQL query generation using OpenAI
    3. Query execution with proper timeout handling
    4. Pipeline operations and refinement
    5. Debug information collection
    """

    def __init__(self):
        """
        Initialize the QueryPipelineManager with OpenAI API and DuckDB connection.
        """
        self.openai = openai
        self.conn = conn

        # Enhanced debug information structure
        self.debug_info = {
            "last_prompt": None,
            "last_generated_query": None,
            "last_execution_error": None,
            "last_execution_result": None,
            "last_openai_response": None,
            "table_selection_info": None,
            "performance_metrics": {},
            "database_info": None,
        }

        # Initialize database info
        self._update_database_info()

    def _update_database_info(self):
        """Update database information in debug info"""
        try:
            from app.internal.db_manager import get_database_info

            self.debug_info["database_info"] = get_database_info()
        except Exception as e:
            logger.warning(f"Could not get database info: {e}")
            self.debug_info["database_info"] = {"error": str(e)}

    def log_debug(self, operation: str, data: dict):
        """Log debug information with structured format and performance tracking"""
        timestamp = time.time()

        logger.debug(f"\n{'=' * 50}")
        logger.debug(f"OPERATION: {operation} - {time.strftime('%H:%M:%S')}")
        logger.debug(f"{'=' * 50}")

        for key, value in data.items():
            if isinstance(value, str) and len(value) > 200:
                logger.debug(f"{key.upper()}: {value[:200]}...")
            else:
                logger.debug(f"{key.upper()}: {value}")

        logger.debug(f"{'=' * 50}\n")

        # Store performance metrics
        if operation not in self.debug_info["performance_metrics"]:
            self.debug_info["performance_metrics"][operation] = []

        self.debug_info["performance_metrics"][operation].append(
            {
                "timestamp": timestamp,
                "data_size": len(str(data)),
            }
        )

    def get_debug_info(self):
        """Return comprehensive debug information"""
        return {
            **self.debug_info,
            "timestamp": time.time(),
            "total_operations": sum(
                len(ops) for ops in self.debug_info["performance_metrics"].values()
            ),
        }

    def clear_debug_info(self):
        """Clear debug information while preserving database info"""
        database_info = self.debug_info.get("database_info")

        self.debug_info = {
            "last_prompt": None,
            "last_generated_query": None,
            "last_execution_error": None,
            "last_execution_result": None,
            "last_openai_response": None,
            "table_selection_info": None,
            "performance_metrics": {},
            "database_info": database_info,
        }

    def fetch_table_names(self):
        """
        Fetch table names with enhanced filtering and error handling.

        Returns:
            List of valid table names, excluding system tables
        """
        try:
            start_time = time.time()

            # Get all tables but exclude FlockMTL internal tables
            tables_info = get_all_tables()

            # Handle error cases
            if isinstance(tables_info, str):
                logger.error(f"Error fetching tables: {tables_info}")
                return []

            if not tables_info:
                logger.warning("No tables found in database")
                return []

            # Filter out system tables and extract names
            table_names = []
            excluded_prefixes = ["FLOCKMTL", "INFORMATION_SCHEMA", "PG_", "SYS_"]

            for table_info in tables_info:
                table_name = table_info.get("table_name", "")

                # Skip empty names and system tables
                if not table_name:
                    continue

                if any(
                    table_name.upper().startswith(prefix)
                    for prefix in excluded_prefixes
                ):
                    logger.debug(f"Excluding system table: {table_name}")
                    continue

                # Skip tables with errors
                if "error" in table_info:
                    logger.warning(f"Skipping table with error: {table_name}")
                    continue

                table_names.append(table_name)

            execution_time = time.time() - start_time

            self.log_debug(
                "FETCH_TABLE_NAMES",
                {
                    "total_tables_found": len(tables_info),
                    "valid_tables": len(table_names),
                    "table_names": table_names,
                    "execution_time": f"{execution_time:.3f}s",
                },
            )

            logger.info(
                f"Found {len(table_names)} valid tables in {execution_time:.3f}s"
            )
            return table_names

        except Exception as e:
            error_msg = f"Error fetching table names: {e}"
            logger.error(error_msg, exc_info=True)

            self.log_debug(
                "FETCH_TABLE_NAMES_ERROR",
                {"error": error_msg, "traceback": traceback.format_exc()},
            )

            return []

    def fetch_table_schema(self, table_names: list[str]):
        """
        Fetch table schemas with improved error handling and validation.

        Args:
            table_names: List of table names to get schemas for

        Returns:
            List of dictionaries with table schema information
        """
        if not table_names:
            logger.warning("No table names provided for schema fetching")
            return []

        start_time = time.time()
        table_schemas = []

        for table_name in table_names:
            try:
                # Validate table name
                if not table_name or not isinstance(table_name, str):
                    logger.warning(f"Invalid table name: {table_name}")
                    continue

                # Use the existing get_table_schema function
                schema_result = get_table_schema(table_name)

                if isinstance(schema_result, str):
                    # Error occurred
                    logger.error(
                        f"Schema error for table '{table_name}': {schema_result}"
                    )
                    continue

                if not schema_result:
                    logger.warning(f"Empty schema for table '{table_name}'")
                    continue

                # Process schema information
                schema_data = []
                for column in schema_result:
                    if len(column) >= 2:
                        schema_data.append(
                            {
                                "column_name": column[0],
                                "data_type": column[1],
                                "nullable": column[2] if len(column) > 2 else None,
                                "default": column[3] if len(column) > 3 else None,
                            }
                        )

                table_schemas.append(
                    {
                        "table_name": table_name,
                        "schema": schema_data,
                        "column_count": len(schema_data),
                    }
                )

                logger.debug(
                    f"Schema fetched for '{table_name}': {len(schema_data)} columns"
                )

            except Exception as e:
                logger.error(f"Error fetching schema for table '{table_name}': {e}")
                continue

        execution_time = time.time() - start_time

        self.log_debug(
            "FETCH_TABLE_SCHEMA",
            {
                "requested_tables": len(table_names),
                "successful_schemas": len(table_schemas),
                "execution_time": f"{execution_time:.3f}s",
                "schemas_summary": [
                    {"table": schema["table_name"], "columns": schema["column_count"]}
                    for schema in table_schemas
                ],
            },
        )

        logger.info(
            f"Fetched schemas for {len(table_schemas)}/{len(table_names)} tables in {execution_time:.3f}s"
        )
        return table_schemas

    def choose_table_based_on_prompt(self, prompt: str):
        """
        Selects the appropriate tables based on the user's prompt.
        """
        logger.debug(f"Starting table selection for prompt: {prompt}")

        table_names = self.fetch_table_names()
        if not table_names:
            self.debug_info["table_selection_info"] = {
                "available_tables": [],
                "selected_tables": [],
                "error": "No tables available",
            }
            logger.warning("No tables available for selection")
            return []

        table_selection_prompt = SYSTEM_TABLE_SELECTION.format(table_names=table_names)

        self.log_debug(
            "TABLE_SELECTION",
            {
                "user_prompt": prompt,
                "available_tables": table_names,
                "system_prompt": table_selection_prompt,
            },
        )

        try:
            response = self.openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": table_selection_prompt},
                    {"role": "user", "content": prompt},
                ],
            )

            raw_response = response.choices[0].message.content
            logger.debug(f"OpenAI table selection response: {raw_response}")

            # Try to safely evaluate the response
            result = eval(raw_response)
            # Ensure it's a list
            if isinstance(result, str):
                selected_tables = [result]
            elif isinstance(result, list):
                selected_tables = result
            else:
                selected_tables = []

            self.debug_info["table_selection_info"] = {
                "available_tables": table_names,
                "selected_tables": selected_tables,
                "raw_response": raw_response,
                "success": True,
            }

            logger.debug(f"Selected tables: {selected_tables}")
            return selected_tables

        except Exception as e:
            error_msg = f"Table selection failed: {str(e)}"
            logger.error(error_msg)
            self.debug_info["table_selection_info"] = {
                "available_tables": table_names,
                "selected_tables": table_names,  # fallback
                "error": error_msg,
                "success": False,
            }
            # If evaluation fails, return all available tables as fallback
            return table_names

    def generate_sql_query(self, prompt: str, selected_tables: list[str] = None):
        """
        Generates an SQL query based on the user's prompt and the selected table schema.
        """
        logger.debug(f"Starting SQL generation for prompt: {prompt}")
        if selected_tables:
            logger.debug(f"Using user-selected tables: {selected_tables}")

        self.debug_info["last_prompt"] = prompt

        # Use user-selected tables if provided, otherwise auto-select based on prompt
        if selected_tables and len(selected_tables) > 0:
            table_names = selected_tables
            logger.info(f"Using {len(table_names)} user-selected tables: {table_names}")
        else:
            table_names = self.choose_table_based_on_prompt(prompt)
            logger.info(
                f"Auto-selected {len(table_names)} tables based on prompt: {table_names}"
            )

        if not table_names:
            error_msg = "No tables available. Please upload some data first."
            self.debug_info["last_execution_error"] = error_msg
            return f"SELECT '{error_msg}' AS error_message;"

        table_schema = self.fetch_table_schema(table_names)
        if not table_schema:
            error_msg = "Could not retrieve table schema. Please check your tables."
            self.debug_info["last_execution_error"] = error_msg
            return f"SELECT '{error_msg}' AS error_message;"

        generation_prompt = SYSTEM_GENERATION_PROMPT.format(
            table_name=table_names, table_schema=table_schema
        )

        self.log_debug(
            "SQL_GENERATION",
            {
                "user_prompt": prompt,
                "selected_tables": table_names,
                "table_schemas": table_schema,
                "system_prompt_length": len(generation_prompt),
                "system_prompt_preview": generation_prompt[:500] + "..."
                if len(generation_prompt) > 500
                else generation_prompt,
            },
        )

        try:
            response = self.openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": generation_prompt},
                    {"role": "user", "content": prompt},
                ],
            )

            generated_query = response.choices[0].message.content.strip()

            self.debug_info["last_openai_response"] = {
                "model": "gpt-4o-mini",
                "prompt_tokens": response.usage.prompt_tokens
                if hasattr(response, "usage")
                else None,
                "completion_tokens": response.usage.completion_tokens
                if hasattr(response, "usage")
                else None,
                "raw_response": generated_query,
            }

            self.debug_info["last_generated_query"] = generated_query

            logger.debug(f"Generated SQL query: {generated_query}")

            return generated_query

        except Exception as e:
            error_msg = f"SQL generation failed: {str(e)}"
            logger.error(error_msg)
            traceback.print_exc()
            self.debug_info["last_execution_error"] = error_msg
            return f"SELECT '{error_msg}' AS error_message;"

    def regenerate_sql_query(
        self, prompt: str, generated_query: str, selected_tables: list[str] = None
    ):
        """
        Regenerates an SQL query based on the user's prompt and the generated query.
        """
        # Use user-selected tables if provided, otherwise auto-select based on prompt
        if selected_tables and len(selected_tables) > 0:
            table_names = selected_tables
        else:
            table_names = self.choose_table_based_on_prompt(prompt)

        if not table_names:
            return "SELECT 'No tables available. Please upload some data first.' AS error_message;"

        table_schema = self.fetch_table_schema(table_names)
        if not table_schema:
            return "SELECT 'Could not retrieve table schema. Please check your tables.' AS error_message;"

        generation_prompt = SYSTEM_GENERATION_PROMPT.format(
            table_name=table_names, table_schema=table_schema
        )
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": generation_prompt},
                {
                    "role": "system",
                    "content": "The User will provide you with the generated query and the prompt and your need to regenerate the query, make sure that the query is much clear and generates a well structured table.",
                },
                {"role": "user", "content": prompt},
                {"role": "user", "content": generated_query},
            ],
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
                {"role": "user", "content": query},
            ],
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)

    def execute_sql_query(self, query: str):
        """
        Executes the SQL query on the database and returns the results.
        """
        logger.debug(f"Executing SQL query: {query}")

        self.log_debug(
            "SQL_EXECUTION",
            {
                "query": query,
                "query_length": len(query),
                "connection_status": "active" if self.conn else "inactive",
            },
        )

        try:
            # Clear previous execution info
            self.debug_info["last_execution_error"] = None
            self.debug_info["last_execution_result"] = None

            start_time = time.time()

            # Check if this is a FlockMTL query (contains llm_ functions)
            is_flockmtl_query = any(
                func in query.lower()
                for func in ["llm_complete", "llm_filter", "llm_embedding"]
            )

            if is_flockmtl_query:
                logger.info("Detected FlockMTL query - setting higher timeout")

            results = self.conn.execute(query)
            rows = results.fetchall()
            columns = [column[0] for column in results.description]
            end_time = time.time()

            execution_result = [dict(zip(columns, row)) for row in rows]

            self.debug_info["last_execution_result"] = {
                "rows_returned": len(execution_result),
                "columns": columns,
                "execution_time_seconds": end_time - start_time,
                "sample_data": execution_result[:3] if execution_result else [],
                "success": True,
                "is_flockmtl_query": is_flockmtl_query,
            }

            self.log_debug(
                "SQL_EXECUTION_SUCCESS",
                {
                    "rows_returned": len(execution_result),
                    "columns": columns,
                    "execution_time": f"{end_time - start_time:.3f}s",
                    "sample_data": execution_result[:2]
                    if execution_result
                    else "No data",
                    "is_flockmtl_query": is_flockmtl_query,
                },
            )

            return execution_result

        except Exception as e:
            error_msg = str(e)
            execution_time = time.time() - start_time if "start_time" in locals() else 0

            # Enhanced error classification
            error_type = type(e).__name__
            is_timeout_error = any(
                keyword in error_msg.lower()
                for keyword in ["timeout", "connection", "socket", "network", "hang up"]
            )
            is_flockmtl_error = any(
                keyword in error_msg.lower()
                for keyword in ["llm_", "openai", "api", "model"]
            )

            error_details = {
                "error_message": error_msg,
                "error_type": error_type,
                "query": query,
                "execution_time_seconds": execution_time,
                "is_timeout_error": is_timeout_error,
                "is_flockmtl_error": is_flockmtl_error,
                "traceback": traceback.format_exc(),
            }

            self.debug_info["last_execution_error"] = error_details

            logger.error(f"SQL execution failed: {error_msg}")
            logger.error(f"Execution time: {execution_time:.3f}s")
            logger.error(f"Error type: {error_type}")
            logger.error(f"Is timeout error: {is_timeout_error}")
            logger.error(f"Is FlockMTL error: {is_flockmtl_error}")
            logger.debug(f"Full traceback: {traceback.format_exc()}")

            self.log_debug("SQL_EXECUTION_ERROR", error_details)

            raise e

    def generate_response_table(self, prompt: str, selected_tables: list[str] = None):
        """
        Generates a response table based on the user's prompt.
        """
        logger.debug(f"Starting response table generation for prompt: {prompt}")
        if selected_tables:
            logger.debug(f"Using selected tables: {selected_tables}")

        try:
            query = self.generate_sql_query(prompt, selected_tables)
            time_start = time.time()
            table = self.execute_sql_query(query)
            time_end = time.time()

            result = {
                "prompt": prompt,
                "query": query,
                "table": table,
                "execution_time": round(time_end - time_start, 3),
                "selected_tables": selected_tables or [],
                "debug_info": self.get_debug_info(),
            }

            self.log_debug(
                "RESPONSE_TABLE_SUCCESS",
                {
                    "prompt": prompt,
                    "generated_query": query,
                    "table_rows": len(table),
                    "execution_time": f"{time_end - time_start:.3f}s",
                },
            )

            return result

        except Exception as e:
            error_msg = str(e)
            execution_debug = self.get_debug_info().get("last_execution_error", {})

            # Enhanced error message based on error type
            if execution_debug.get("is_timeout_error"):
                user_friendly_error = (
                    "The query execution timed out. This might happen with complex AI operations. "
                    "Try simplifying your request or try again."
                )
            elif execution_debug.get("is_flockmtl_error"):
                user_friendly_error = (
                    "FlockMTL function execution failed. Please check if your OpenAI API key is configured correctly "
                    "and you have sufficient API quota."
                )
            elif "no tables available" in error_msg.lower():
                user_friendly_error = "No suitable tables found for your query. Please upload some data first."
            else:
                user_friendly_error = f"Query execution failed: {error_msg}"

            logger.error(f"Response table generation failed: {error_msg}")
            logger.error(f"Full traceback: {traceback.format_exc()}")

            return {
                "prompt": prompt,
                "query": self.debug_info.get(
                    "last_generated_query", "Query generation failed"
                ),
                "table": [{"error": user_friendly_error}],
                "execution_time": execution_debug.get("execution_time_seconds", 0),
                "selected_tables": selected_tables or [],
                "debug_info": self.get_debug_info(),
                "error": {
                    "message": user_friendly_error,
                    "technical_details": error_msg,
                    "error_type": execution_debug.get("error_type", type(e).__name__),
                },
            }

    def generate_input_query_response_table(self, query: str):
        """
        Generates a response table based on the user's query.
        """
        time_start = time.time()
        table = self.execute_sql_query(query)
        time_end = time.time()
        return {
            "query": query,
            "table": table,
            "execution_time": round(time_end - time_start, 3),
        }

    def generate_query_plan(self, query: str):
        """
        Generates a query plan based on the user's query.
        """
        pipeline = self.generate_pipeline_for_query(query)
        return {"query": query, "pipeline": pipeline}

    def regenerate_response_table(
        self, prompt: str, generated_query: str, selected_tables: list[str] = None
    ):
        """
        Regenerates the response table based on the user's prompt and the generated query.
        """
        query = self.regenerate_sql_query(prompt, generated_query, selected_tables)
        time_start = time.time()
        table = self.execute_sql_query(query)
        time_end = time.time()
        return {
            "prompt": prompt,
            "query": query,
            "table": table,
            "execution_time": round(time_end - time_start),
            "selected_tables": selected_tables or [],
        }

    def refine_query_based_on_pipeline(self, query: str, pipeline: dict):
        """
        Refines the SQL query based on the pipeline and user prompt.
        """
        table_names = self.choose_table_based_on_prompt(query)
        if not table_names:
            return "SELECT 'No tables available. Please upload some data first.' AS error_message;"

        table_schema = self.fetch_table_schema(table_names)
        if not table_schema:
            return "SELECT 'Could not retrieve table schema. Please check your tables.' AS error_message;"

        generation_prompt = SYSTEM_GENERATION_PROMPT.format(
            table_name=table_names, table_schema=table_schema
        )
        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": generation_prompt},
                {
                    "role": "system",
                    "content": SYSTEM_PIPELINE_RUNNING.format(
                        pipeline=pipeline, user_query=query
                    ),
                },
            ],
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
            "query": new_query,
            "table": table,
            "execution_time": round(time_end - time_start),
            "pipeline": new_pipeline,
        }

    def generate_plot_config(self, prompt: str, table: any):
        """
        Generates a plot configuration based on the user's prompt and the table data.
        """

        response = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PLOT_CONFIG.format(
                        user_data=table, user_prompt=prompt
                    ),
                }
            ],
            response_format={"type": "json_object"},
        )

        return json.loads(response.choices[0].message.content)
