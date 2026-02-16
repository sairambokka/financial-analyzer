"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileUploadZone } from "./file-upload-zone";
import { CSVColumnMapper } from "./csv-column-mapper";
import { TransactionPreviewTable } from "./transaction-preview-table";
import { parseCSVFile, mapRowsToTransactions } from "@/lib/parsers/csv-parser";
import { categorizeTransactions } from "@/lib/categorizer";
import type { ParsedRow, ColumnMappings, CategorizedTransaction } from "@/lib/types/parsing.types";
import type { CategoryRule, Category } from "@/lib/types/database.types";

type Step = "upload" | "map" | "preview";

interface CSVUploadFlowProps {
  rules: CategoryRule[];
  categories: Category[];
  onComplete: () => void;
}

export function CSVUploadFlow({ rules, categories, onComplete }: CSVUploadFlowProps) {
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
      // Create statement record
      const stmtRes = await fetch("/api/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          file_type: "csv",
          period_start: transactions.length > 0 ? transactions[transactions.length - 1].date : null,
          period_end: transactions.length > 0 ? transactions[0].date : null,
        }),
      });

      if (!stmtRes.ok) throw new Error("Failed to create statement");
      const stmt = await stmtRes.json();

      // Upload file to storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("statementId", stmt.id);

      const uploadRes = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file");
      const { storage_path } = await uploadRes.json();

      // Update statement with storage path
      await fetch("/api/statements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: stmt.id, storage_path }),
      });

      // Bulk insert transactions
      const txInserts = transactions.map((tx) => ({
        statement_id: stmt.id,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        category_id: tx.category_id,
        raw_text: tx.raw_text,
      }));

      const txRes = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txInserts),
      });

      if (!txRes.ok) throw new Error("Failed to save transactions");

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
