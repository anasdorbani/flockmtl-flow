import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

interface Params {
  params: {
    tableName: string;
  };
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { tableName } = await params;

    const response = await fetch(`${BACKEND_URL}/data/tables/${tableName}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Table delete error:", error);
    return NextResponse.json(
      { detail: "Failed to delete table" },
      { status: 500 }
    );
  }
}
