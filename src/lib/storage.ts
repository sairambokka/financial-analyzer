import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export async function uploadStatementFile(
  supabase: Client,
  userId: string,
  statementId: string,
  file: File
): Promise<string> {
  const path = `${userId}/${statementId}/${file.name}`;

  const { error } = await supabase.storage
    .from("statements")
    .upload(path, file, { upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

export async function deleteStatementFile(
  supabase: Client,
  storagePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from("statements")
    .remove([storagePath]);

  if (error) throw new Error(`Delete failed: ${error.message}`);
}
