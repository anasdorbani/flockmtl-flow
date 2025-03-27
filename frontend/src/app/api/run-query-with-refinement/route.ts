import axios from "axios";
import type { Pipeline } from "@/../types/pipeline";
import { demoPipeline } from "./demo-pipeline";

export async function POST(request: Request): Promise<Response> {
  const { query, pipeline }: { query: string, pipeline: Pipeline } = await request.json();

  // await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('query', query);
  console.log('pipeline', pipeline);

  const response = await axios.post(
    "http://localhost:8000/run-query-with-refinement",
    {
      query,
      pipeline,
    },
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  return new Response(JSON.stringify(response.data), {
    headers: { "Content-Type": "application/json" },
  });

  return new Response(JSON.stringify({ pipeline: demoPipeline, query: 'test' }), {
    headers: { "Content-Type": "application/json" },
  });
}
