# FlockMTL Flow

This project is built on top of [FlockMTL](https://dsg-polymtl.github.io/flockmtl/), a DuckDB extension for building LLM-powered data applications.

## Project Structure

The project is organized into two main components:

### Backend

A FastAPI backend that handles:
- Query pipeline management
- Database connections
- API endpoints for pipeline execution

### Frontend

A Next.js frontend that provides:
- Interactive UI for building and visualizing query pipelines
- Components for viewing query responses
- SQL editor integration

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   pip install -e .
   ```

3. Run the development server:
   ```
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Run the development server:
   ```
   pnpm dev
   ```

## Features

- Visual pipeline builder for query construction
- Interactive nodes for different pipeline operations
- Real-time query execution and refinement
- Integration with SQL and data visualization tools

## License

[MIT](LICENSE)