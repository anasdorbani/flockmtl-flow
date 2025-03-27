import type { Pipeline } from "@/../types/pipeline";
import { OutputData } from "@/_components/data";

export const demoPipeline: Pipeline = {
  id: 1,
  name: "SCAN_TABLE",
  description: "Scans all rows from 'reviews'",
  is_function: false,
  children: [
    {
      id: 2,
      name: "FILTER",
      description: "Filters rows based on conditions",
      is_function: false,
      children: [
        {
          id: 3,
          name: "llm_filter",
          description:
            "Filters reviews mentioning technical issues using FlockMTL",
          is_function: true,
          params: {
            model_name: "gpt-4o-mini",
            prompt: "List reviews mentioning technical issues",
            input_columns: ["Review"],
          },
          children: [
            {
              id: 4,
              name: "PROJ",
              description: "Projects columns with transformations",
              is_function: false,
              children: [
                {
                  id: 5,
                  name: "llm_complete_json",
                  description:
                    "Generates severity scores for technical issues using FlockMTL",
                  is_function: true,
                  params: {
                    model_name: "gpt-4o-mini",
                    prompt: "Give a severity score for each technical issue",
                    input_columns: ["Review"],
                  },
                  children: [
                    {
                      id: 6,
                      name: "Sink",
                      description: "Sends data to output",
                      is_function: false,
                      children: [
                        {
                          id: 0,
                          name: "Results",
                          description: "",
                          is_function: false,
                          metrics: {
                            rows: 30,
                            columns: 5,
                            execution_time: 3.567,
                          },
                          data: OutputData,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
