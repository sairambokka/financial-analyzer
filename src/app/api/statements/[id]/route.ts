import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { deleteFile } from "@/lib/storage-local";
import type { Statement } from "@/lib/types/database.types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const db = getDb();

    // Get statement to find storage path
    const statement = db
      .prepare("SELECT * FROM statements WHERE id = ?")
      .get(id) as Statement | undefined;

    if (!statement) {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 }
      );
    }

    // Delete from database (will cascade to transactions)
    db.prepare("DELETE FROM statements WHERE id = ?").run(id);

    // Delete file if it exists
    if (statement.storage_path) {
      try {
        await deleteFile(statement.storage_path);
      } catch (error) {
        console.error("Error deleting file:", error);
        // Continue even if file deletion fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting statement:", error);
    return NextResponse.json(
      { error: "Failed to delete statement" },
      { status: 500 }
    );
  }
}
