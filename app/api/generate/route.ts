import { NextRequest, NextResponse } from "next/server";
import { createTable, insertData, saveApiMetadata } from "@/lib/database";
import { v4 as uuidv4 } from "uuid";
import type { ColumnSchema } from "@/lib/file-parser";

export const runtime = "nodejs";

const generateKey = (prefix: string) => `${prefix}_${uuidv4().replace(/-/g, "")}`;

export async function POST(request: NextRequest) {
  try {
    const { fileName, columns, rows } = await request.json();

    if (!fileName || !columns || !rows) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const cleanName = fileName.split(".")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const uniqueId = uuidv4().split("-")[0];
    const realTableName = `user_${cleanName}_${uniqueId}`;

    const adminKey = generateKey("sk");
    const readKey = generateKey("pk");

    await createTable(realTableName, columns as ColumnSchema[]);

    if (rows.length > 0) {
      const BATCH_SIZE = 500;
      const batches: Promise<void>[] = [];
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        batches.push(insertData(realTableName, rows.slice(i, i + BATCH_SIZE)));
      }
      await Promise.all(batches);
    }

    await saveApiMetadata({
      id: uuidv4(),
      originalName: fileName,
      tableName: realTableName,
      adminKey,
      readKey,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const apiPath = `/api/data/${realTableName}`;

    return NextResponse.json({
      success: true,
      api: {
        fileName,
        tableName: realTableName,
        adminKey,
        readKey,
        globalApiUrl: `${baseUrl}${apiPath}`,
        endpoints: [
          { method: "GET", path: `${apiPath}?apiKey=${readKey}`, description: "Retrieve all records (Read Only)" },
          { method: "GET", path: `${apiPath}/{id}?apiKey=${readKey}`, description: "Retrieve a single record" },
          { method: "POST", path: `${apiPath}?apiKey=${adminKey}`, description: "Create a new record (Admin Access)" },
          { method: "PUT", path: `${apiPath}/{id}?apiKey=${adminKey}`, description: "Update a record (Admin Access)" },
          { method: "DELETE", path: `${apiPath}/{id}?apiKey=${adminKey}`, description: "Delete a record (Admin Access)" },
        ],
        schema: {
          type: "object",
          properties: (columns as ColumnSchema[]).reduce((acc: Record<string, any>, col) => {
            acc[col.name] = { type: col.type, nullable: col.nullable };
            return acc;
          }, {}),
        },
      },
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
