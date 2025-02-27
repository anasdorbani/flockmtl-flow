import axios from "axios";
import type { Pipeline } from "../../../../types/pipeline";

export async function POST(request: Request): Promise<Response> {
  const { prompt }: { prompt: string } = await request.json();

  // await new Promise((resolve) => setTimeout(resolve, 2000));
  const response = await axios.post(
    "http://localhost:8000/pipeline/generate-pipeline",
    {
      prompt: prompt,
    },
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  console.log(JSON.stringify(response.data.pipeline))
  const pipeline: Pipeline = response.data.pipeline;


  return new Response(JSON.stringify(pipeline), {
    headers: { "Content-Type": "application/json" },
  });
}
