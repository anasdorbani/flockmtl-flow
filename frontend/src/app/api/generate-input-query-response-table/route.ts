import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { query }: { query: string } = await request.json();

    const response = await axios.post(
      `${BACKEND_URL}/generate-input-query-response-table`,
      { query },
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
    console.error("Generate input query response table error:", error);

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
          error.response?.data?.detail ||
          "Failed to generate input query response table",
      },
      { status: error.response?.status || 500 }
    );
  }
}
