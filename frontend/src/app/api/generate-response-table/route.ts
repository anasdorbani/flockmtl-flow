import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const {
      prompt,
      selected_tables,
    }: { prompt: string; selected_tables?: string[] } = await request.json();

    const response = await axios.post(
      `${BACKEND_URL}/generate-response-table`,
      { prompt, selected_tables: selected_tables || [] },
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
    console.error("Generate response table error:", error);

    if (
      error.code === "ECONNRESET" ||
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {
      return NextResponse.json(
        { detail: "Request timeout - the query took too long to process" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        detail:
          error.response?.data?.detail || "Failed to generate response table",
      },
      { status: error.response?.status || 500 }
    );
  }
}
