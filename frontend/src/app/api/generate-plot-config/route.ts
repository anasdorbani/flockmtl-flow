import axios from "axios";
import type { Pipeline } from "@/../types/pipeline";
import { demoPipeline } from "./demo-pipeline";

export async function POST(request: Request): Promise<Response> {
  const { prompt, table }: { prompt: string, table: any[] } = await request.json();

  // await new Promise((resolve) => setTimeout(resolve, 3000));
  console.log(table)
  const response = await axios.post(
    "http://localhost:8000/generate-plot-config",
    {
      prompt,
      table: table,
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
