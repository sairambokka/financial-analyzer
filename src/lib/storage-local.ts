import { mkdir, writeFile, unlink, rmdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";

const UPLOAD_BASE = process.env.UPLOAD_PATH || "./data/uploads";

/**
 * Save a file to local storage
 * @param statementId - Statement ID for organizing files
 * @param fileName - Original file name
 * @param buffer - File data as Buffer
 * @returns Storage path relative to upload base
 */
export async function saveFile(
  statementId: string,
  fileName: string,
  buffer: Buffer
): Promise<string> {
  const statementDir = join(UPLOAD_BASE, statementId);
  const filePath = join(statementDir, fileName);

  // Create directory if it doesn't exist
  await mkdir(statementDir, { recursive: true });

  // Write file
  await writeFile(filePath, buffer);

  // Return relative path from base
  return `${statementId}/${fileName}`;
}

/**
 * Delete a file from local storage
 * @param storagePath - Relative storage path (e.g., "statementId/fileName")
 */
export async function deleteFile(storagePath: string): Promise<void> {
  const filePath = join(UPLOAD_BASE, storagePath);

  if (!existsSync(filePath)) {
    return; // File doesn't exist, nothing to do
  }

  // Delete the file
  await unlink(filePath);

  // Try to remove the parent directory if it's empty
  const parentDir = dirname(filePath);
  try {
    await rmdir(parentDir);
  } catch {
    // Directory not empty or other error - ignore
  }
}
