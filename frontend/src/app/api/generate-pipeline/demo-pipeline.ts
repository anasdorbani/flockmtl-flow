import type { Pipeline } from "../../../../types/pipeline";

export const pipeline: Pipeline = {
  prompt:
    "Give me a full table summarizing the progress of our company during the last 3 years.",
  prompt_expansion: [
    "Provide a comprehensive summary of our company's growth over the last three years.",
    "Summarize the company's performance metrics from the past three years.",
    "Detail our company's annual progress and milestones.",
  ],
  data_filtering: {
    prompt:
      "Give me a full table summarizing the progress of our company during the last 3 years.",
    query:
      "SELECT year, SUM(revenue) AS total_revenue, COUNT(DISTINCT customer_id) AS total_customers FROM sales INNER JOIN customers ON sales.customer_id = customers.id WHERE year >= 2021 GROUP BY year ORDER BY year DESC;",
  },
  insights_extraction: {
    prompt:
      "Give me a full table summarizing the progress of our company during the last 3 years.",
    query:
      "WITH revenue_data AS (SELECT year, SUM(revenue) AS yearly_revenue FROM sales WHERE year >= 2021 GROUP BY year), customer_data AS (SELECT year, COUNT(DISTINCT customer_id) AS customer_count FROM sales GROUP BY year) SELECT rd.year, rd.yearly_revenue, cd.customer_count, (rd.yearly_revenue / LAG(rd.yearly_revenue) OVER (ORDER BY rd.year)) * 100 AS revenue_growth_percentage FROM revenue_data rd JOIN customer_data cd ON rd.year = cd.year ORDER BY rd.year DESC;",
  },
  final_results: {
    data: [
      {
        year: 2021,
        revenue: "$2,500,000",
        customer_growth: "15%",
        employee_satisfaction: "85%",
      },
      {
        year: 2022,
        revenue: "$3,200,000",
        customer_growth: "20%",
        employee_satisfaction: "90%",
      },
      {
        year: 2023,
        revenue: "$4,000,000",
        customer_growth: "25%",
        employee_satisfaction: "92%",
      },
    ],
    summary:
      "Over the last three years, the company has experienced consistent revenue growth, increased customer acquisition, and improved employee satisfaction metrics.",
  },
};
