import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Category } from "@/lib/types/database.types";

export async function GET() {
  try {
    const db = getDb();
    const categories = db
      .prepare("SELECT * FROM categories ORDER BY name")
      .all() as Category[];

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
