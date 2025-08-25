import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import pandas as pd
import duckdb
import os
import tempfile
from pathlib import Path

from app.internal.database import conn, get_all_tables, get_table_schema, execute_query
from app.internal.db_manager import get_database_info

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload-csv")
async def upload_csv(files: List[UploadFile] = File(...)):
    """Upload one or more CSV files and create tables"""
    try:
        uploaded_tables = []

        for file in files:
            if not file.filename.endswith(".csv"):
                raise HTTPException(
                    status_code=400, detail=f"File {file.filename} is not a CSV file"
                )

            # Generate a unique table name based on filename
            table_name = (
                Path(file.filename).stem.lower().replace(" ", "_").replace("-", "_")
            )

            # Read CSV content
            content = await file.read()

            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp_file:
                tmp_file.write(content)
                tmp_file_path = tmp_file.name

            try:
                # Read CSV with pandas to handle various formats
                df = pd.read_csv(tmp_file_path)

                # Clean column names
                df.columns = [
                    col.lower().replace(" ", "_").replace("-", "_")
                    for col in df.columns
                ]

                # Drop existing table if it exists
                conn.execute(f"DROP TABLE IF EXISTS {table_name}")

                # Create table from DataFrame
                conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM df")

                # Get table info
                row_count = conn.execute(
                    f"SELECT COUNT(*) FROM {table_name}"
                ).fetchone()[0]
                columns = [
                    desc[0]
                    for desc in conn.execute(f"DESCRIBE {table_name}").fetchall()
                ]

                uploaded_tables.append(
                    {
                        "table_name": table_name,
                        "original_filename": file.filename,
                        "row_count": row_count,
                        "columns": columns,
                    }
                )

            finally:
                # Clean up temporary file
                os.unlink(tmp_file_path)

        return JSONResponse(
            content={
                "message": f"Successfully uploaded {len(uploaded_tables)} table(s)",
                "tables": uploaded_tables,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-duckdb")
async def upload_duckdb(file: UploadFile = File(...)):
    """Upload a DuckDB database file"""
    try:
        if not file.filename.endswith(".db") and not file.filename.endswith(".duckdb"):
            raise HTTPException(
                status_code=400,
                detail="File must be a DuckDB database (.db or .duckdb)",
            )

        # Read database file content
        content = await file.read()

        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".duckdb") as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

        try:
            # Connect to the uploaded database
            uploaded_conn = duckdb.connect(tmp_file_path, read_only=True)

            # Get all tables from uploaded database
            tables = uploaded_conn.execute("SHOW TABLES").fetchall()

            imported_tables = []

            for table_row in tables:
                table_name = table_row[0]

                # Copy table to main connection
                conn.execute(f"DROP TABLE IF EXISTS {table_name}")

                # Get data from uploaded database and create table in main database
                data = uploaded_conn.execute(f"SELECT * FROM {table_name}").fetchall()
                columns_info = uploaded_conn.execute(
                    f"DESCRIBE {table_name}"
                ).fetchall()

                # Create table structure
                column_defs = []
                for col_info in columns_info:
                    col_name, col_type = col_info[0], col_info[1]
                    column_defs.append(f"{col_name} {col_type}")

                create_table_sql = (
                    f"CREATE TABLE {table_name} ({', '.join(column_defs)})"
                )
                conn.execute(create_table_sql)

                # Insert data
                if data:
                    placeholders = ", ".join(["?"] * len(columns_info))
                    insert_sql = f"INSERT INTO {table_name} VALUES ({placeholders})"
                    conn.executemany(insert_sql, data)

                row_count = len(data)
                columns = [col_info[0] for col_info in columns_info]

                imported_tables.append(
                    {
                        "table_name": table_name,
                        "row_count": row_count,
                        "columns": columns,
                    }
                )

            uploaded_conn.close()

        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)

        return JSONResponse(
            content={
                "message": f"Successfully imported {len(imported_tables)} table(s) from DuckDB",
                "tables": imported_tables,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables")
async def get_tables():
    """Get list of all available tables"""
    try:
        tables_info = get_all_tables()
        return JSONResponse(content={"tables": tables_info})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables/{table_name}/schema")
async def get_table_schema_endpoint(table_name: str):
    """Get schema for a specific table"""
    try:
        schema = get_table_schema(table_name)
        return JSONResponse(content={"table_name": table_name, "schema": schema})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables/{table_name}/preview")
async def get_table_preview(table_name: str, limit: int = 10):
    """Get a preview of table data"""
    try:
        query = f"SELECT * FROM {table_name} LIMIT {limit}"
        result = execute_query(query)

        # Get column names
        columns_info = get_table_schema(table_name)
        columns = [col[0] for col in columns_info]

        # Convert result to list of dictionaries
        preview_data = [dict(zip(columns, row)) for row in result]

        return JSONResponse(
            content={
                "table_name": table_name,
                "columns": columns,
                "data": preview_data,
                "showing": min(limit, len(result)),
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tables/{table_name}")
async def delete_table(table_name: str):
    """Delete a table"""
    try:
        conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        logger.info(f"Table '{table_name}' deleted successfully")
        return JSONResponse(
            content={"message": f"Table {table_name} deleted successfully"}
        )
    except Exception as e:
        logger.error(f"Error deleting table '{table_name}': {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_data_status():
    """Get comprehensive data system status"""
    try:
        # Get database information
        db_info = get_database_info()

        # Get table information
        tables_info = get_all_tables()

        # Calculate statistics
        total_tables = len(tables_info) if isinstance(tables_info, list) else 0
        total_rows = 0

        if isinstance(tables_info, list):
            for table in tables_info:
                if isinstance(table, dict) and "row_count" in table:
                    if isinstance(table["row_count"], int) and table["row_count"] >= 0:
                        total_rows += table["row_count"]

        status = {
            "database_info": db_info,
            "tables": {
                "total_count": total_tables,
                "total_rows": total_rows,
                "details": tables_info if isinstance(tables_info, list) else [],
            },
            "capabilities": {
                "csv_upload": True,
                "duckdb_upload": True,
                "table_management": True,
                "flockmtl_available": db_info.get("flockmtl_available", False),
            },
        }

        logger.info(
            f"Data status retrieved: {total_tables} tables, {total_rows} total rows"
        )
        return JSONResponse(content=status)

    except Exception as e:
        logger.error(f"Error getting data status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
