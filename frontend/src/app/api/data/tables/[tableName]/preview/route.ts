import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

interface Params {
  params: {
    tableName: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { tableName } = await params;
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit") || "10";

    const response = await fetch(
      `${BACKEND_URL}/data/tables/${tableName}/preview?limit=${limit}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Table preview error:", error);
    return NextResponse.json(
      { detail: "Failed to fetch table preview" },
      { status: 500 }
    );
  }
}
