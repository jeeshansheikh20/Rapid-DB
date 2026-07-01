import { NextRequest, NextResponse } from "next/server";
import { getRecordById, updateRecord, deleteRecord, getProjectByApiKey } from "@/lib/database";

export const runtime = "nodejs";

// Reusing the same validator logic (You could move this to lib/auth.ts to avoid duplication)
async function validateRequest(req: NextRequest, tableParam: string, requireAdmin = false) {
  const apiKey = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("apiKey");

  if (!apiKey) return { error: "Missing API Key", status: 401 };

  const project = await getProjectByApiKey(apiKey);

  if (!project) return { error: "Invalid API Key", status: 403 };
  if (project.table_name !== tableParam) return { error: "API Key mismatch", status: 403 };
  if (requireAdmin && apiKey !== project.admin_key) return { error: "Write permission denied", status: 403 };

  return { success: true };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params;

  // Read Access OK
  const validation = await validateRequest(req, table, false);
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: validation.status });

  const record = await getRecordById(table, Number(id));

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params;

  // Admin Access REQUIRED
  const validation = await validateRequest(req, table, true);
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: validation.status });

  try {
    const body = await req.json();
    // Prevent user from changing their own ID
    delete body.id; 
    
    const updated = await updateRecord(table, Number(id), body);
    
    if (!updated) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params;

  // Admin Access REQUIRED
  const validation = await validateRequest(req, table, true);
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: validation.status });

  const success = await deleteRecord(table, Number(id));

  if (!success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Record deleted" });
}