import duckdb
import json
import os

# Connect to a physical DuckDB database file
conn = duckdb.connect(database=":memory:", read_only=False)

# Install FlockMTL extension
conn.execute("""
    INSTALL flockmtl FROM community;
    LOAD flockmtl;
""")

conn.execute(f"""
             CREATE SECRET (
                 TYPE OPENAI,
                 API_KEY '{os.getenv("OPENAI_API_KEY")}'
             )
             """)

# Create the updated employees table with new schema
# Create employees table
conn.execute("""
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY,
        name TEXT,
        position TEXT,
        department TEXT,
        salary FLOAT,
        experience_years INTEGER,
        education TEXT,
        location TEXT,
        performance_rating FLOAT,
        last_promotion_year INTEGER,
        bio TEXT
    );
""")

# Create projects table
conn.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY,
        name TEXT,
        department TEXT,
        budget FLOAT,
        deadline TEXT,
        status TEXT,
        manager TEXT,
        team_size INTEGER,
        description TEXT
    );
""")

# Create clients table
conn.execute("""
    CREATE TABLE IF NOT EXISTS clients (
        client_id INTEGER PRIMARY KEY,
        client_name TEXT,
        industry TEXT,
        location TEXT,
        account_manager TEXT,
        status TEXT
    );
""")

# Create tasks table
conn.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        task_id INTEGER PRIMARY KEY,
        project_id INTEGER,
        assigned_to TEXT,
        title TEXT,
        description TEXT,
        status TEXT,
        due_date TEXT,
        priority TEXT
    );
""")

# Insert fake data into tables
def insert_data_from_json(file_path, table_name, columns):
    with open(file_path) as json_file:
        data = json.load(json_file)

    data_to_insert = [tuple(entry[col] for col in columns) for entry in data]

    placeholders = ", ".join(["?"] * len(columns))
    query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"

    conn.executemany(query, data_to_insert)
    conn.commit()

# Insert data into respective tables
insert_data_from_json('app/internal/data/fake_employees.json', 'employees', [
    "id", "name", "position", "department", "salary", "experience_years", 
    "education", "location", "performance_rating", "last_promotion_year", "bio"
])

insert_data_from_json('app/internal/data/fake_projects.json', 'projects', [
    "id", "name", "department", "budget", "deadline", "status", "manager", "team_size", "description"
])

insert_data_from_json('app/internal/data/fake_clients.json', 'clients', [
    "client_id", "client_name", "industry", "location", "account_manager", "status"
])

insert_data_from_json('app/internal/data/fake_tasks.json', 'tasks', [
    "task_id", "project_id", "assigned_to", "title", "description", "status", "due_date", "priority"
])

# Function to execute any query
def execute_query(query: str):
    """Execute a given SQL query and return results"""
    try:
        result = conn.execute(query).fetchall()
        return result
    except Exception as e:
        return str(e)

# Function to get table schema
def get_table_schema(table_name: str="employees"):
    """Get schema of a specific table"""
    try:
        schema = conn.execute(f"DESCRIBE {table_name};").fetchall()
        return schema
    except Exception as e:
        return str(e)
