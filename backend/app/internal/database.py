import duckdb
import json

# Connect to a physical DuckDB database file
conn = duckdb.connect(database=":memory:", read_only=False)

# Create the updated employees table with new schema
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
        skills TEXT,
        bio TEXT
    );
""")

# Insert fake data into the database
with open('app/internal/data/fake_data.json') as json_file:
    fake_data = json.load(json_file)

# Convert list of skills into a string format (comma-separated)
data_to_insert = [
    (
        data['id'],
        data['name'],
        data['position'],
        data['department'],
        data['salary'],
        data['experience_years'],
        data['education'],
        data['location'],
        data['performance_rating'],
        data['last_promotion_year'],
        ", ".join(data['skills']),  # Convert list to string
        data['bio']
    )
    for data in fake_data
]

conn.executemany("""
    INSERT INTO employees 
    (id, name, position, department, salary, experience_years, education, location, performance_rating, last_promotion_year, skills, bio) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
""", data_to_insert)


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
