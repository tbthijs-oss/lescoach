import { NextRequest, NextResponse } from "next/server";
import {
  getSchool,
  updateSchool,
  deleteSchool,
  listLerarenForSchool,
} from "@/lib/authDb";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const school = await getSchool(id);
  if (!school) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  const leraren = await listLerarenForSchool(id);
  return NextResponse.json({ school, leraren });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const patch = await request.json();
    const school = await updateSchool(id, patch);
    return NextResponse.json({ school });
  } catch (err) {
    console.error("[beheer/scholen/:id] PATCH:", err);
    return NextResponse.json({ error: "Kon school niet bijwerken" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await deleteSchool(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[beheer/scholen/:id] DELETE:", err);
    return NextResponse.json({ error: "Kon school niet verwijderen" }, { status: 500 });
  }
}
