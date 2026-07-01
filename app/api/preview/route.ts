import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/file-parser";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const schema = await parseFile(file);

    return NextResponse.json({
      success: true,
      fileName: schema.fileName,
      tableName: schema.tableName,
      columns: schema.columns,
      rows: schema.allData.slice(0, 500),
      totalRows: schema.allData.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to parse file" },
      { status: 500 }
    );
  }
}
