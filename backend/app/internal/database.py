import json
import os
import logging
from .db_manager import get_connection

# Set up logging
logger = logging.getLogger(__name__)

# Get the database connection
try:
    conn = get_connection()
    logger.info("Database connection obtained successfully")
except Exception as e:
    logger.error(f"Failed to get database connection: {e}")
    raise


def _insert_data_from_csv(file_path: str, table_name: str, columns: list[str]):
    """
    Helper function to insert data from CSV file into table.

    Args:
        file_path: Path to the CSV file
        table_name: Name of the target table
        columns: List of column names in correct order
    """
    import csv

    if not os.path.exists(file_path):
        logger.warning(f"Data file not found: {file_path}")
        return

    try:
        with open(file_path, "r") as csv_file:
            csv_reader = csv.DictReader(csv_file)
            data = list(csv_reader)

        if not data:
            logger.warning(f"No data found in {file_path}")
            return

        # Prepare data for insertion
        data_to_insert = []
        for entry in data:
            row = []
            for col in columns:
                value = entry.get(col, "")
                # Convert numeric values - expanded list for new columns
                if value and col in [
                    "balance",
                    "amount",
                    "loan_amount",
                    "commission_fee",
                ]:
                    try:
                        value = float(value)
                    except ValueError:
                        pass
                row.append(value)
            data_to_insert.append(tuple(row))

        # Create parameterized query
        placeholders = ", ".join(["?"] * len(columns))
        query = (
            f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
        )

        # Insert data
        conn.executemany(query, data_to_insert)
        conn.commit()

        logger.info(f"✅ Inserted {len(data_to_insert)} rows into '{table_name}'")

    except Exception as e:
        logger.error(f"❌ Failed to insert data into '{table_name}': {e}")


def _insert_data_from_json(file_path: str, table_name: str, columns: list[str]):
    """
    Helper function to insert data from JSON file into table.
    (Legacy support for old JSON files)

    Args:
        file_path: Path to the JSON file
        table_name: Name of the target table
        columns: List of column names in correct order
    """
    if not os.path.exists(file_path):
        logger.warning(f"Data file not found: {file_path}")
        return

    try:
        with open(file_path, "r") as json_file:
            data = json.load(json_file)

        if not data:
            logger.warning(f"No data found in {file_path}")
            return

        # Prepare data for insertion
        data_to_insert = [tuple(entry.get(col) for col in columns) for entry in data]

        # Create parameterized query
        placeholders = ", ".join(["?"] * len(columns))
        query = (
            f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
        )

        # Insert data
        conn.executemany(query, data_to_insert)
        conn.commit()

        logger.info(f"✅ Inserted {len(data_to_insert)} rows into '{table_name}'")

    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON in {file_path}: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to insert data into '{table_name}': {e}")


def load_sample_data():
    """
    Load banking demo database with sample data for demonstration purposes.

    This function creates a complete banking schema with the following tables:
    - customers: Customer information with branch associations
    - branches: Bank branch locations and details
    - accounts: Customer bank accounts with balances
    - transactions: Financial transactions history
    - loans: Customer loans information
    - atms: ATM locations and fee structures

    This function creates tables and loads data only if called explicitly.
    It follows a clean sequence:
    1. Create table schemas
    2. Load data from CSV files if they exist
    3. Log results
    """
    logger.info("Starting sample data loading process...")

    # Define table schemas for banking demo database
    table_schemas = {
        "customers": {
            "schema": """
                customer_id TEXT PRIMARY KEY,
                first_name TEXT,
                last_name TEXT,
                date_of_birth TEXT,
                gender TEXT,
                branch_id TEXT,
                occupation TEXT,
                income_range TEXT,
                customer_notes TEXT,
                risk_profile TEXT
            """,
            "columns": [
                "customer_id",
                "first_name",
                "last_name",
                "date_of_birth",
                "gender",
                "branch_id",
                "occupation",
                "income_range",
                "customer_notes",
                "risk_profile",
            ],
            "file": "app/internal/data/customers.csv",
        },
        "branches": {
            "schema": """
                branch_id TEXT PRIMARY KEY,
                branch_name TEXT,
                branch_city TEXT,
                branch_type TEXT,
                specialization TEXT,
                customer_demographics TEXT,
                performance_notes TEXT
            """,
            "columns": [
                "branch_id",
                "branch_name",
                "branch_city",
                "branch_type",
                "specialization",
                "customer_demographics",
                "performance_notes",
            ],
            "file": "app/internal/data/branches.csv",
        },
        "accounts": {
            "schema": """
                account_id TEXT PRIMARY KEY,
                customer_id TEXT,
                account_type TEXT,
                opened_date TEXT,
                balance FLOAT,
                account_status TEXT,
                usage_pattern TEXT,
                financial_goals TEXT
            """,
            "columns": [
                "account_id",
                "customer_id",
                "account_type",
                "opened_date",
                "balance",
                "account_status",
                "usage_pattern",
                "financial_goals",
            ],
            "file": "app/internal/data/accounts.csv",
        },
        "transactions": {
            "schema": """
                transaction_id TEXT PRIMARY KEY,
                account_id TEXT,
                transaction_date TEXT,
                transaction_type TEXT,
                amount FLOAT,
                transaction_description TEXT,
                merchant_category TEXT,
                transaction_sentiment TEXT
            """,
            "columns": [
                "transaction_id",
                "account_id",
                "transaction_date",
                "transaction_type",
                "amount",
                "transaction_description",
                "merchant_category",
                "transaction_sentiment",
            ],
            "file": "app/internal/data/transactions.csv",
        },
        "loans": {
            "schema": """
                loan_id TEXT PRIMARY KEY,
                account_id TEXT,
                loan_type TEXT,
                loan_amount FLOAT,
                loan_date TEXT,
                loan_purpose TEXT,
                approval_rationale TEXT,
                repayment_behavior TEXT
            """,
            "columns": [
                "loan_id",
                "account_id",
                "loan_type",
                "loan_amount",
                "loan_date",
                "loan_purpose",
                "approval_rationale",
                "repayment_behavior",
            ],
            "file": "app/internal/data/loans.csv",
        },
        "atms": {
            "schema": """
                atm_id TEXT PRIMARY KEY,
                branch_id TEXT,
                location TEXT,
                commission_fee FLOAT,
                usage_pattern TEXT,
                security_level TEXT,
                customer_feedback TEXT
            """,
            "columns": [
                "atm_id",
                "branch_id",
                "location",
                "commission_fee",
                "usage_pattern",
                "security_level",
                "customer_feedback",
            ],
            "file": "app/internal/data/atms.csv",
        },
    }

    # Step 1: Create tables
    for table_name, config in table_schemas.items():
        try:
            create_sql = (
                f"CREATE TABLE IF NOT EXISTS {table_name} ({config['schema']});"
            )
            conn.execute(create_sql)
            logger.info(f"✅ Table '{table_name}' created/verified")
        except Exception as e:
            logger.error(f"❌ Failed to create table '{table_name}': {e}")
            continue

    # Step 2: Load data from CSV files
    for table_name, config in table_schemas.items():
        try:
            if config["file"].endswith(".csv"):
                _insert_data_from_csv(config["file"], table_name, config["columns"])
            else:
                _insert_data_from_json(config["file"], table_name, config["columns"])
        except Exception as e:
            logger.error(f"❌ Failed to load data for table '{table_name}': {e}")

    logger.info("Sample data loading process completed")


def execute_query(query: str):
    """
    Execute a SQL query and return results with proper error handling.

    Args:
        query: SQL query string to execute

    Returns:
        Query results as list of tuples, or error string if query fails

    Note:
        This function includes safety checks and logging for debugging
    """
    if not query or not query.strip():
        logger.warning("Empty query provided to execute_query")
        return "Error: Empty query provided"

    try:
        logger.debug(
            f"Executing query: {query[:100]}{'...' if len(query) > 100 else ''}"
        )
        result = conn.execute(query).fetchall()
        logger.debug(f"Query executed successfully, returned {len(result)} rows")
        return result

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Query execution failed: {error_msg}")
        logger.debug(f"Failed query: {query}")
        return f"Query execution error: {error_msg}"


def get_table_schema(table_name: str):
    """
    Get schema information for a specific table.

    Args:
        table_name: Name of the table to describe

    Returns:
        List of tuples containing column information (name, type, etc.)
        or error string if table doesn't exist or other error occurs
    """
    if not table_name or not table_name.strip():
        return "Error: No table name provided"

    try:
        logger.debug(f"Getting schema for table: {table_name}")
        schema = conn.execute(f"DESCRIBE {table_name};").fetchall()
        logger.debug(f"Schema retrieved for '{table_name}': {len(schema)} columns")
        return schema

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to get schema for table '{table_name}': {error_msg}")
        return f"Schema error: {error_msg}"


def get_all_tables():
    """
    Get comprehensive information about all tables in the database.

    Returns:
        List of dictionaries containing table information:
        - table_name: Name of the table
        - row_count: Number of rows in the table
        - columns: List of column names

        Or error string if operation fails
    """
    try:
        logger.debug("Retrieving all table information...")
        tables = conn.execute("SHOW TABLES;").fetchall()

        if not tables:
            logger.info("No tables found in database")
            return []

        tables_info = []
        for table_row in tables:
            table_name = table_row[0]

            try:
                # Get row count
                row_count_result = conn.execute(
                    f"SELECT COUNT(*) FROM {table_name}"
                ).fetchone()
                row_count = row_count_result[0] if row_count_result else 0

                # Get column information
                columns_info = conn.execute(f"DESCRIBE {table_name}").fetchall()
                columns = [col[0] for col in columns_info]

                tables_info.append(
                    {
                        "table_name": table_name,
                        "row_count": row_count,
                        "columns": columns,
                    }
                )

                logger.debug(
                    f"Table info collected for '{table_name}': {row_count} rows, {len(columns)} columns"
                )

            except Exception as e:
                logger.error(f"Error collecting info for table '{table_name}': {e}")
                # Add table with error info
                tables_info.append(
                    {
                        "table_name": table_name,
                        "row_count": -1,
                        "columns": [],
                        "error": str(e),
                    }
                )

        logger.info(f"Successfully retrieved information for {len(tables_info)} tables")
        return tables_info

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to get table list: {error_msg}")
        return f"Table listing error: {error_msg}"


# Load sample data on startup if LOAD_SAMPLE_DATA environment variable is set
if os.getenv("LOAD_SAMPLE_DATA", "false").lower() == "true":
    logger.info("LOAD_SAMPLE_DATA is enabled, loading sample data...")
    try:
        load_sample_data()
    except Exception as e:
        logger.error(f"Failed to load sample data: {e}")
else:
    logger.info("LOAD_SAMPLE_DATA is disabled, skipping sample data loading")
