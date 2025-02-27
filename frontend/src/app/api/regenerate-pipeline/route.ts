import type { Pipeline } from "../../../../types/pipeline";

export async function POST(request: Request): Promise<Response> {
  const { pipeline }: { pipeline: Pipeline } = await request.json();

  await new Promise((resolve) => setTimeout(resolve, 2000));

  return new Response(JSON.stringify(pipeline), {
    headers: { "Content-Type": "application/json" },
  });
}
