import axios from "axios";
import type { Pipeline } from "@/../types/pipeline";
import { demoPipeline } from "./demo-pipeline";

export async function POST(request: Request): Promise<Response> {
  const { prompt }: { prompt: string } = await request.json();

  // const response = await axios.post(
  //   "http://localhost:8000/pipeline/generate-pipeline",
  //   {
  //     prompt: prompt,
  //   },
  //   {
  //     headers: {
  //       accept: "application/json",
  //       "Content-Type": "application/json",
  //     },
  //   }
  // );

  // return new Response(JSON.stringify(response.data), {
  //   headers: { "Content-Type": "application/json" },
  // });

  return new Response(JSON.stringify({ pipeline: demoPipeline, query: 'test' }), {
    headers: { "Content-Type": "application/json" },
  });
}
