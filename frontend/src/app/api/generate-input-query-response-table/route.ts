import axios from "axios";
import type { Pipeline } from "@/../types/pipeline";
import { demoPipeline } from "./demo-pipeline";

export async function POST(request: Request): Promise<Response> {
  const { query }: { query: string } = await request.json();

  // await new Promise((resolve) => setTimeout(resolve, 3000));

  const response = await axios.post(
    "http://localhost:8000/generate-input-query-response-table",
    {
      query
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
