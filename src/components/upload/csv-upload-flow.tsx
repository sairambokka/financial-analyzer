"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileUploadZone } from "./file-upload-zone";
import { CSVColumnMapper } from "./csv-column-mapper";
import { TransactionPreviewTable } from "./transaction-preview-table";
import { parseCSVFile, mapRowsToTransactions } from "@/lib/parsers/csv-parser";
import { categorizeTransactions } from "@/lib/categorizer";
import { uploadStatementFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import type { ParsedRow, ColumnMappings, CategorizedTransaction } from "@/lib/types/parsing.types";
import type { Database } from "@/lib/types/database.types";

type CategoryRule = Database["public"]["Tables"]["category_rules"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

type Step = "upload" | "map" | "preview";

interface CSVUploadFlowProps {
  userId: string;
  rules: CategoryRule[];
  categories: Category[];
  onComplete: () => void;
}

export function CSVUploadFlow({ userId, rules, categories, onComplete }: CSVUploadFlowProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [transactions, setTransactions] = useState<CategorizedTransaction[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleFile(f: File) {
    try {
      const { headers: h, rows: r } = await parseCSVFile(f);
      if (h.length === 0) {
        toast.error("CSV file has no headers");
        return;
      }
      setFile(f);
      setHeaders(h);
      setRows(r);
      setStep("map");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse CSV");
    }
  }

  function handleMapping(mappings: ColumnMappings) {
    const parsed = mapRowsToTransactions(rows, mappings);
    if (parsed.length === 0) {
      toast.error("No valid transactions found with these column mappings");
      return;
    }
    const categorized = categorizeTransactions(parsed, rules, categories);
    setTransactions(categorized);
    setStep("preview");
  }

  async function handleSave() {
    if (!file) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert statement record
      const { data: stmt, error: stmtErr } = await supabase
        .from("statements")
        .insert({
          user_id: userId,
          file_name: file.name,
          file_type: "csv",
          period_start: transactions.length > 0 ? transactions[transactions.length - 1].date : null,
          period_end: transactions.length > 0 ? transactions[0].date : null,
        })
        .select("id")
        .single();

      if (stmtErr || !stmt) throw new Error(stmtErr?.message ?? "Failed to create statement");

      // Upload file to storage
      const storagePath = await uploadStatementFile(supabase, userId, stmt.id, file);

      // Update statement with storage path
      await supabase
        .from("statements")
        .update({ storage_path: storagePath })
        .eq("id", stmt.id);

      // Bulk insert transactions
      const txInserts = transactions.map((tx) => ({
        user_id: userId,
        statement_id: stmt.id,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        category_id: tx.category_id,
        raw_text: tx.raw_text,
      }));

      const { error: txErr } = await supabase.from("transactions").insert(txInserts);
      if (txErr) throw new Error(txErr.message);

      toast.success(`Saved ${transactions.length} transactions`);
      reset();
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setRows([]);
    setTransactions([]);
  }

  if (step === "map") {
    return <CSVColumnMapper headers={headers} onConfirm={handleMapping} onCancel={reset} />;
  }

  if (step === "preview") {
    return (
      <TransactionPreviewTable
        transactions={transactions}
        onConfirm={handleSave}
        onCancel={reset}
        saving={saving}
      />
    );
  }

  return (
    <FileUploadZone
      accept=".csv"
      onFile={handleFile}
      label="Drop your CSV file here"
      description="Supports most bank and credit card CSV exports"
    />
  );
}
