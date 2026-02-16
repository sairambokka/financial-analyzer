import { NextRequest, NextResponse } from "next/server";
import { getDb, generateId } from "@/lib/db";
import type { Statement } from "@/lib/types/database.types";

export async function GET() {
  try {
    const db = getDb();
    const statements = db
      .prepare("SELECT * FROM statements ORDER BY upload_date DESC")
      .all() as Statement[];

    return NextResponse.json(statements);
  } catch (error) {
    console.error("Error fetching statements:", error);
    return NextResponse.json(
      { error: "Failed to fetch statements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const db = getDb();
    const id = generateId();

    db.prepare(`
      INSERT INTO statements (id, file_name, file_type, period_start, period_end)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      body.file_name,
      body.file_type || null,
      body.period_start || null,
      body.period_end || null
    );

    const statement = db
      .prepare("SELECT * FROM statements WHERE id = ?")
      .get(id) as Statement;

    return NextResponse.json(statement);
  } catch (error) {
    console.error("Error creating statement:", error);
    return NextResponse.json(
      { error: "Failed to create statement" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, storage_path } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Statement ID is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = db
      .prepare("UPDATE statements SET storage_path = ? WHERE id = ?")
      .run(storage_path || null, id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating statement:", error);
    return NextResponse.json(
      { error: "Failed to update statement" },
      { status: 500 }
    );
  }
}
