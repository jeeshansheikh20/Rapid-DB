import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/file-parser";
import { createTable, insertData, saveApiMetadata } from "@/lib/database";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

const generateKey = (prefix: string) => `${prefix}_${uuidv4().replace(/-/g, "")}`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: "No files provided" }, { status: 400 });
    }

    const generatedApis: any[] = [];

    for (const file of files) {
      // 1. Parse File
      const schema = await parseFile(file);

      // 2. Generate Identity & Keys
      const uniqueId = uuidv4().split("-")[0];
      const safeName = schema.tableName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const realTableName = `user_${safeName}_${uniqueId}`;
      
      const adminKey = generateKey("sk"); // Secret Key
      const readKey = generateKey("pk");  // Public Key

      // 3. Database Operations
      await createTable(realTableName, schema.columns);
      if (schema.allData.length > 0) {
        // Insert in batches to avoid exceeding PostgreSQL's parameter limit,
        // and run batches concurrently for better throughput on large sheets.
        const BATCH_SIZE = 500;
        const batches: Promise<void>[] = [];
        for (let i = 0; i < schema.allData.length; i += BATCH_SIZE) {
          batches.push(insertData(realTableName, schema.allData.slice(i, i + BATCH_SIZE)));
        }
        await Promise.all(batches);
      }

      await saveApiMetadata({
        id: uuidv4(),
        originalName: file.name,
        tableName: realTableName,
        adminKey,
        readKey,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      // 4. Construct Response (Bringing back 'endpoints' and 'schema')
      const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
      const apiPath = `/api/data/${realTableName}`;

      generatedApis.push({
        fileName: file.name,
        tableName: realTableName,
        adminKey,
        readKey,
        globalApiUrl: `${baseUrl}${apiPath}`, // For the main link
        
        // FIX: The frontend needs this array to loop over!
        endpoints: [
          {
            method: "GET",
            path: `${apiPath}?apiKey=${readKey}`,
            description: "Retrieve all records (Read Only)",
          },
          {
            method: "GET",
            path: `${apiPath}/{id}?apiKey=${readKey}`,
            description: "Retrieve a single record",
          },
          {
            method: "POST",
            path: `${apiPath}?apiKey=${adminKey}`,
            description: "Create a new record (Admin Access)",
          },
          {
            method: "PUT",
            path: `${apiPath}/{id}?apiKey=${adminKey}`,
            description: "Update a record (Admin Access)",
          },
          {
            method: "DELETE",
            path: `${apiPath}/{id}?apiKey=${adminKey}`,
            description: "Delete a record (Admin Access)",
          },
        ],

        // FIX: The frontend needs this schema object!
        schema: {
          type: "object",
          properties: schema.columns.reduce((acc, col) => {
            acc[col.name] = { type: col.type, nullable: col.nullable };
            return acc;
          }, {} as Record<string, any>),
        },
      });
    }

    return NextResponse.json({
      success: true,
      apis: generatedApis,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}