import { NextRequest, NextResponse } from "next/server";
import { saveFile } from "@/lib/storage-local";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const statementId = formData.get("statementId") as string | null;

    if (!file || !statementId) {
      return NextResponse.json(
        { error: "file and statementId are required" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file locally
    const storagePath = await saveFile(statementId, file.name, buffer);

    return NextResponse.json({ storage_path: storagePath });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
