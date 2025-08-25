import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const {
      prompt,
      generated_query,
      selected_tables,
    }: { prompt: string; generated_query: string; selected_tables?: string[] } =
      await request.json();

    const response = await axios.post(
      `${BACKEND_URL}/regenerate-response-table`,
      { prompt, generated_query, selected_tables: selected_tables || [] },
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
    console.error("Regenerate response table error:", error);

    if (
      error.code === "ECONNRESET" ||
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {
      return NextResponse.json(
        { detail: "Request timeout - the regeneration took too long" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        detail:
          error.response?.data?.detail || "Failed to regenerate response table",
      },
      { status: error.response?.status || 500 }
    );
  }
}
