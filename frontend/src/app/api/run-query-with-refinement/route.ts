import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import type { Pipeline } from "@/../types/pipeline";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { query, pipeline }: { query: string; pipeline: Pipeline } =
      await request.json();

    console.log("query", query);
    console.log("pipeline", pipeline);

    const response = await axios.post(
      `${BACKEND_URL}/run-query-with-refinement`,
      { query, pipeline },
      {
        timeout: 120000, // 2 minute timeout for FlockMTL queries
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Run query with refinement error:", error);

    if (
      error.code === "ECONNRESET" ||
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {
      return NextResponse.json(
        { detail: "Request timeout - the query refinement took too long" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        detail:
          error.response?.data?.detail || "Failed to run query with refinement",
      },
      { status: error.response?.status || 500 }
    );
  }
}
