# Enhanced Banking Demo Database Schema

## Overview

This is a comprehensive banking database with 6 interconnected tables, each containing exactly 10 rows of semantically rich sample data. The schema is specifically designed to support complex SQL queries, semantic joins using FlockMTL functions, AI-powered analysis, classification, and summarization tasks.

## Tables with Semantic Content

### 1. **customers** (10 rows)

Rich customer profiles with detailed notes and risk assessments

- `customer_id` (TEXT PRIMARY KEY): Unique customer identifier (C001-C010)
- `first_name`, `last_name` (TEXT): Customer names
- `date_of_birth` (TEXT): Birth date in YYYY-MM-DD format
- `gender` (TEXT): Gender (M/F)
- `branch_id` (TEXT): References branches table (B001-B010)
- **`occupation` (TEXT)**: Detailed occupation information for semantic analysis
- **`income_range` (TEXT)**: Income brackets for financial segmentation
- **`customer_notes` (TEXT)**: Rich text descriptions for AI summarization and analysis
- **`risk_profile` (TEXT)**: Risk assessment text for classification tasks

### 2. **branches** (10 rows)

Comprehensive branch information with specializations and performance data

- `branch_id` (TEXT PRIMARY KEY): Unique branch identifier (B001-B010)
- `branch_name` (TEXT): Branch display name
- `branch_city` (TEXT): City location
- **`branch_type` (TEXT)**: Branch category for semantic grouping
- **`specialization` (TEXT)**: Service specializations for semantic matching
- **`customer_demographics` (TEXT)**: Target customer descriptions for AI analysis
- **`performance_notes` (TEXT)**: Detailed performance descriptions for summarization

### 3. **accounts** (10 rows)

Account details with usage patterns and financial goals

- `account_id` (TEXT PRIMARY KEY): Unique account identifier (A1001-A1010)
- `customer_id` (TEXT): References customers table
- `account_type` (TEXT): Account type categories
- `opened_date` (TEXT): Account opening date
- `balance` (FLOAT): Current balance
- **`account_status` (TEXT)**: Current status for semantic filtering
- **`usage_pattern` (TEXT)**: Detailed usage descriptions for AI analysis
- **`financial_goals` (TEXT)**: Customer goals for semantic matching and planning

### 4. **transactions** (10 rows)

Rich transaction data with descriptions and sentiment analysis

- `transaction_id` (TEXT PRIMARY KEY): Unique transaction identifier (T0001-T0010)
- `account_id` (TEXT): References accounts table
- `transaction_date` (TEXT): Transaction date
- `transaction_type` (TEXT): Transaction type
- `amount` (FLOAT): Transaction amount
- **`transaction_description` (TEXT)**: Detailed descriptions for semantic analysis
- **`merchant_category` (TEXT)**: Business categories for classification
- **`transaction_sentiment` (TEXT)**: Sentiment analysis text for AI processing

### 5. **loans** (10 rows)

Comprehensive loan data with purposes and behavior analysis

- `loan_id` (TEXT PRIMARY KEY): Unique loan identifier (L001-L010)
- `account_id` (TEXT): References accounts table
- `loan_type` (TEXT): Loan category
- `loan_amount` (FLOAT): Loan principal
- `loan_date` (TEXT): Origination date
- **`loan_purpose` (TEXT)**: Detailed purpose descriptions for semantic analysis
- **`approval_rationale` (TEXT)**: Approval reasoning for AI summarization
- **`repayment_behavior` (TEXT)**: Performance descriptions for classification

### 6. **atms** (10 rows)

ATM data with usage patterns and customer feedback

- `atm_id` (TEXT PRIMARY KEY): Unique ATM identifier (M001-M010)
- `branch_id` (TEXT): References branches table
- `location` (TEXT): Physical location descriptions
- `commission_fee` (FLOAT): Transaction fees
- **`usage_pattern` (TEXT)**: Detailed usage descriptions for analysis
- **`security_level` (TEXT)**: Security descriptions for semantic grouping
- **`customer_feedback` (TEXT)**: Customer feedback for sentiment analysis

## Advanced FlockMTL Semantic Queries

### 1. **Customer Risk Classification**

```sql
-- Classify customers by risk level using AI
SELECT
    customer_id,
    first_name,
    last_name,
    llm_complete(
        {'model_name': 'gpt-4o-mini'},
        {
            'prompt': 'Classify this customer risk level as HIGH, MEDIUM, or LOW based on their profile',
            'context_columns': [
                {'data': occupation, 'name': 'job'},
                {'data': income_range, 'name': 'income'},
                {'data': customer_notes, 'name': 'notes'},
                {'data': risk_profile, 'name': 'risk'}
            ]
        }
    ) AS ai_risk_classification
FROM customers;
```

### 2. **Branch Performance Summarization**

```sql
-- Summarize branch performance by category
SELECT
    branch_type,
    llm_reduce(
        {'model_name': 'gpt-4o-mini'},
        {
            'prompt': 'Create a comprehensive performance summary for these bank branches',
            'context_columns': [
                {'data': branch_name, 'name': 'branch'},
                {'data': specialization, 'name': 'specialty'},
                {'data': customer_demographics, 'name': 'customers'},
                {'data': performance_notes, 'name': 'performance'}
            ]
        }
    ) AS performance_summary
FROM branches
GROUP BY branch_type;
```

### 3. **Semantic Join: Match Customers to Optimal Branches**

```sql
-- Find customers whose profiles match branch specializations
SELECT
    c.customer_id,
    c.first_name,
    c.last_name,
    b.branch_name,
    b.specialization
FROM customers c
CROSS JOIN branches b
WHERE llm_filter(
    {'model_name': 'gpt-4o-mini'},
    {
        'prompt': 'Does this customer profile match the branch specialization and target demographics?',
        'context_columns': [
            {'data': c.occupation, 'name': 'customer_job'},
            {'data': c.customer_notes, 'name': 'customer_profile'},
            {'data': b.specialization, 'name': 'branch_specialty'},
            {'data': b.customer_demographics, 'name': 'target_customers'}
        ]
    }
)
AND c.branch_id != b.branch_id; -- Only show different branches
```

### 4. **Transaction Sentiment Analysis and Classification**

```sql
-- Classify transactions by business impact
SELECT
    t.transaction_id,
    t.amount,
    llm_complete(
        {'model_name': 'gpt-4o-mini'},
        {
            'prompt': 'Classify this transaction business impact as GROWTH, MAINTENANCE, or RISK based on description and sentiment',
            'context_columns': [
                {'data': t.transaction_description, 'name': 'description'},
                {'data': t.merchant_category, 'name': 'category'},
                {'data': t.transaction_sentiment, 'name': 'sentiment'},
                {'data': t.amount::VARCHAR, 'name': 'amount'}
            ]
        }
    ) AS business_impact_classification
FROM transactions t;
```

### 5. **Loan Purpose Analysis and Recommendations**

```sql
-- Analyze loan purposes and suggest optimal products
SELECT
    loan_type,
    llm_reduce(
        {'model_name': 'gpt-4o-mini'},
        {
            'prompt': 'Analyze these loan purposes and suggest product improvements or new offerings',
            'context_columns': [
                {'data': loan_purpose, 'name': 'purpose'},
                {'data': approval_rationale, 'name': 'rationale'},
                {'data': repayment_behavior, 'name': 'performance'},
                {'data': loan_amount::VARCHAR, 'name': 'amount'}
            ]
        }
    ) AS product_recommendations
FROM loans
GROUP BY loan_type;
```

### 6. **Customer-Account Goal Alignment**

```sql
-- Find misaligned customers whose goals don't match their current account types
SELECT
    c.customer_id,
    c.first_name,
    c.last_name,
    a.account_type,
    a.financial_goals
FROM customers c
JOIN accounts a ON c.customer_id = a.customer_id
WHERE llm_filter(
    {'model_name': 'gpt-4o-mini'},
    {
        'prompt': 'Does this customer profile and risk level mismatch their current account type and financial goals?',
        'context_columns': [
            {'data': c.occupation, 'name': 'job'},
            {'data': c.risk_profile, 'name': 'risk'},
            {'data': a.account_type, 'name': 'current_account'},
            {'data': a.financial_goals, 'name': 'goals'}
        ]
    }
);
```

### 7. **ATM Service Quality Analysis**

```sql
-- Rank ATM locations by service quality
SELECT
    branch_id,
    llm_rerank(
        {'model_name': 'gpt-4o-mini'},
        {
            'prompt': 'Rank these ATM locations by overall service quality and customer satisfaction',
            'context_columns': [
                {'data': location, 'name': 'location'},
                {'data': usage_pattern, 'name': 'usage'},
                {'data': security_level, 'name': 'security'},
                {'data': customer_feedback, 'name': 'feedback'}
            ]
        }
    ) AS service_quality_ranking
FROM atms
GROUP BY branch_id;
```

### 8. **Multi-Table Customer Portfolio Analysis**

```sql
-- Comprehensive customer analysis combining all data sources
SELECT
    c.customer_id,
    c.first_name,
    c.last_name,
    llm_complete(
        {'model_name': 'gpt-4o-mini'},
        {
            'prompt': 'Create a comprehensive customer portfolio analysis and provide strategic recommendations',
            'context_columns': [
                {'data': c.customer_notes, 'name': 'customer_profile'},
                {'data': c.risk_profile, 'name': 'risk_assessment'},
                {'data': a.financial_goals, 'name': 'goals'},
                {'data': a.usage_pattern, 'name': 'account_usage'},
                {'data': l.loan_purpose, 'name': 'loan_needs'},
                {'data': l.repayment_behavior, 'name': 'credit_behavior'}
            ]
        }
    ) AS portfolio_analysis
FROM customers c
JOIN accounts a ON c.customer_id = a.customer_id
LEFT JOIN loans l ON a.account_id = l.account_id;
```

## Key Semantic Features

### **Rich Text Content**

- Detailed customer profiles and risk assessments
- Branch specializations and performance descriptions
- Transaction descriptions with business context
- Loan purposes and approval rationale
- Customer feedback and sentiment analysis

### **Classification Opportunities**

- Customer risk levels (High/Medium/Low)
- Branch types and specializations
- Transaction business impact
- Account status and performance
- Service quality rankings

### **Summarization Tasks**

- Branch performance by category
- Customer portfolio analysis
- Loan product recommendations
- Transaction pattern analysis
- Regional market insights

### **Semantic Join Scenarios**

- Customer-to-branch matching based on needs
- Product-to-customer recommendations
- Risk-to-lending policy alignment
- Service quality correlation analysis

This enhanced schema provides rich semantic content perfect for demonstrating FlockMTL's AI-powered database capabilities including intelligent filtering, content generation, summarization, ranking, and classification tasks.
