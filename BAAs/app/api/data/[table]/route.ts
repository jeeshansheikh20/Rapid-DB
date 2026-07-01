import { NextRequest, NextResponse } from "next/server";
import { getRecords, createRecord, getProjectByApiKey } from "@/lib/database";

export const runtime = "nodejs";

// Helper to validate request
async function validateRequest(req: NextRequest, tableParam: string, requireAdmin = false) {
  // 1. Extract Key (Support Header 'x-api-key' OR Query param 'apiKey')
  const apiKey = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("apiKey");

  if (!apiKey) {
    return { error: "Missing API Key", status: 401 };
  }

  // 2. Lookup Project
  const project = await getProjectByApiKey(apiKey);

  if (!project) {
    return { error: "Invalid API Key", status: 403 };
  }

  // 3. Security: Ensure Key Matches Table
  // (Prevents using a key for "users" to access "orders")
  if (project.table_name !== tableParam) {
    return { error: "API Key does not match this resource", status: 403 };
  }

  // 4. Permission Check
  if (requireAdmin && apiKey !== project.admin_key) {
    return { error: "Write permission denied. Use Admin Key.", status: 403 };
  }

  return { success: true };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;

  // Validate (Read Access OK)
  const validation = await validateRequest(req, table, false);
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: validation.status });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const data = await getRecords(table, limit, offset);
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;

  // Validate (Admin Access REQUIRED)
  const validation = await validateRequest(req, table, true);
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: validation.status });

  try {
    const body = await req.json();
    const record = await createRecord(table, body);
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create record. Check data types." }, { status: 400 });
  }
}