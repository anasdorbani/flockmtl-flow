import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { query }: { query: string } = await request.json();

    const response = await axios.post(
      `${BACKEND_URL}/generate-query-plan`,
      { query },
      {
        timeout: 30000, // 30 second timeout
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Generate query plan error:", error);

    if (
      error.code === "ECONNRESET" ||
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {
      return NextResponse.json(
        { detail: "Request timeout - the query plan generation took too long" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        detail: error.response?.data?.detail || "Failed to generate query plan",
      },
      { status: error.response?.status || 500 }
    );
  }
}
