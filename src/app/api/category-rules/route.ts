import { NextRequest, NextResponse } from "next/server";
import { getDb, generateId } from "@/lib/db";
import type { CategoryRule } from "@/lib/types/database.types";

export async function GET() {
  try {
    const db = getDb();
    const rules = db
      .prepare("SELECT * FROM category_rules ORDER BY created_at DESC")
      .all() as CategoryRule[];

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching category rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch category rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category_id, pattern } = body;

    if (!category_id || !pattern) {
      return NextResponse.json(
        { error: "category_id and pattern are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // UPSERT: Insert or update if pattern already exists
    db.prepare(`
      INSERT INTO category_rules (id, category_id, pattern)
      VALUES (?, ?, ?)
      ON CONFLICT(pattern) DO UPDATE SET category_id = excluded.category_id
    `).run(generateId(), category_id, pattern);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating/updating category rule:", error);
    return NextResponse.json(
      { error: "Failed to create/update category rule" },
      { status: 500 }
    );
  }
}
