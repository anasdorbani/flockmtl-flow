import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { prompt, table }: { prompt: string; table: any[] } =
      await request.json();

    console.log(
      "Generating plot config for table:",
      table?.length || 0,
      "rows"
    );

    const response = await axios.post(
      `${BACKEND_URL}/generate-plot-config`,
      { prompt, table },
      {
        timeout: 30000,
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Generate plot config error:", error);

    if (
      error.code === "ECONNRESET" ||
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {
      return NextResponse.json(
        { detail: "Request timeout - plot config generation took too long" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        detail:
          error.response?.data?.detail || "Failed to generate plot config",
      },
      { status: error.response?.status || 500 }
    );
  }
}
