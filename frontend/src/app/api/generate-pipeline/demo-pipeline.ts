import type { Pipeline } from "@/../types/pipeline";

export const demoPipeline: Pipeline = {
  id: 0,
  name: "Results",
  description: "",
  query_execution_time: 0,
  is_function: false,
  params: {},
  data: [
    {
      id: 1,
      name: "Alice",
      email: "alice@example.com",
      score: 95,
      metadata: { city: "New York", verified: true },
    },
    {
      id: 2,
      name: "Bob",
      email: "bob@example.com",
      score: 87,
      metadata: { city: "San Francisco", verified: false },
    },
    {
      id: 3,
      name: "Charlie",
      email: "charlie@example.com",
      score: 78,
      metadata: { city: "Los Angeles", verified: true },
    },
  ],
  children: [
    {
      id: 1,
      name: "Sink",
      description: "Final operator that materializes the result of the query.",
      is_function: false,
      params: {},
      children: [
        {
          id: 2,
          name: "LLM_Complete",
          description:
            "Generates summaries for each employee based on their details.",
          is_function: true,
          params: {
            model_name: "gpt-4o-mini",
            prompt:
              "Provide a summary for each employee based on their details.",
            input_columns: ["id", "name", "position"],
            batch_size: 10,
            tuple_format: "JSON",
          },
          children: [
            {
              id: 3,
              name: "Scan",
              description: "Reads data from the employees table.",
              is_function: false,
              params: {},
              children: [],
            },
          ],
        },
        {
          id: 4,
          name: "Scan",
          description: "Reads data from the employees table.",
          is_function: false,
          params: {},
          children: [],
        },
      ],
    },
  ],
};
