# 🚀 FlockMTL Flow

> **Transform natural language into powerful database queries with an intuitive visual pipeline**

FlockMTL Flow is a revolutionary tool built on top of [FlockMTL](https://dsg-polymtl.github.io/flockmtl/), a DuckDB extension for creating LLM-powered data applications. This project bridges the gap between natural language and database queries through an interactive visual interface.

## ✨ Why FlockMTL Flow?

Traditional SQL queries require technical expertise, creating barriers for non-technical users who need to extract insights from data. FlockMTL Flow solves this problem by:

- Converting natural language questions into SQL queries
- Providing a visual pipeline builder for query construction
- Delivering semantic analysis of query results
- Making data exploration accessible to everyone

## 🏗️ Project Architecture

FlockMTL Flow follows a modern, modular architecture:

```
flockmtl-flow/
├── 🖥️ frontend/      # Next.js visual interface
└── ⚙️ backend/       # FastAPI server
```

### Backend

The FastAPI backend serves as the engine of FlockMTL Flow:

- **Query Pipeline Management**: Orchestrates the transformation from natural language to SQL
- **Database Connections**: Interfaces with DuckDB and other data sources
- **API Endpoints**: Provides RESTful services for pipeline execution

### Frontend

The Next.js frontend delivers an intuitive user experience:

- **Visual Query Plan**: An interface to generate the query flows
- **Interactive Components**: Real-time visualization of query results
- **SQL Editor Integration**: Advanced options for technical users

## 🚀 Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the development server:
   ```bash
   uv run fastapi dev
   ```
   Make sure to install `uv` project manager from [here](https://docs.astral.sh/uv/getting-started/installation/).

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open your browser to `http://localhost:3000`

## 🔎 Key Features

### Natural Language to SQL (NL2SQL)

FlockMTL Flow uses advanced LLM capabilities to:
- Parse natural language questions
- Generate appropriate SQL queries
- Validate query correctness
- Execute queries against your database

### Interactive Pipeline Building

- **Complex query pipelines**: Easily construct complex query pipelines
- **Real-Time Feedback**: See intermediate results at each step

### Semantic Analysis

FlockMTL Flow doesn't just return raw query results—it provides:
- Contextual explanations of results
- Automated data visualizations
- Insights and anomaly detection
- Natural language summaries

## 💡 Use Cases

- **Business Intelligence**: Help business analysts explore data without SQL expertise
- **Data Exploration**: Quickly answer ad-hoc questions about your data
- **Education**: Teach SQL concepts through visual pipelines
- **Prototyping**: Rapidly build and test data applications

## 📊 Example Queries

```
"Show me sales trends by region for the last quarter"
```
↓ FlockMTL Flow transforms this into ↓
```sql
SELECT 
  region, 
  SUM(sales) as total_sales,
  DATE_TRUNC('month', sale_date) as month
FROM sales
WHERE sale_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)
GROUP BY region, month
ORDER BY region, month
```

---

<p align="center">Built with ❤️ by the FlockMTL team</p>
