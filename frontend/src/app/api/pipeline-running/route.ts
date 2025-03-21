import type { Pipeline } from "../../../../types/pipeline";
import axios from "axios";
import { demoPipeline } from "../generate-pipeline/demo-pipeline";

export async function POST(request: Request): Promise<Response> {
  const { pipeline, query }: { pipeline: Pipeline, query: string } = await request.json();
  console.log(JSON.stringify(pipeline));
  const response = await axios.post(
    "http://localhost:8000/pipeline/pipeline-running",
    {
      pipeline,
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
