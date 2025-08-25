# FlockMTL Flow

An AI-powered data analysis platform that lets you query your data using natural language. Built with [FlockMTL](https://dsg-polymtl.github.io/flockmtl/) and DuckDB.

## Features

- 📁 Upload CSV files or DuckDB databases
- 💬 Ask questions in natural language
- 🔍 Visual query pipeline builder
- 📊 Interactive results and visualizations

## Quick Start

1. **Setup Backend**:
   ```bash
   cd backend
   uv sync
   export OPENAI_API_KEY="your-openai-api-key"
   uv run fastapi dev app/main.py
   ```

2. **Setup Frontend**:
   ```bash
   cd frontend
   pnpm install
   echo "BACKEND_URL=http://localhost:8000" > .env.local
   pnpm dev
   ```

3. **Use the App**:
   - Open http://localhost:3000
   - Upload your data files
   - Ask questions in natural language

## License

[MIT](LICENSE)
