"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { FileUploadZone } from "./file-upload-zone";
import { TransactionPreviewTable } from "./transaction-preview-table";
import { extractTextFromPDF, structureWithClaude } from "@/lib/parsers/pdf-parser";
import { categorizeTransactions } from "@/lib/categorizer";
import type { CategorizedTransaction } from "@/lib/types/parsing.types";
import type { CategoryRule, Category } from "@/lib/types/database.types";

type Step = "upload" | "extracting" | "preview";

interface PDFUploadFlowProps {
  rules: CategoryRule[];
  categories: Category[];
  onComplete: () => void;
}

export function PDFUploadFlow({ rules, categories, onComplete }: PDFUploadFlowProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<CategorizedTransaction[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleFile(f: File) {
    setFile(f);
    setStep("extracting");

    try {
      const text = await extractTextFromPDF(f);
      if (!text.trim()) {
        throw new Error("No text could be extracted from the PDF");
      }

      const categoryNames = categories.map((c) => c.name);
      const parsed = await structureWithClaude(text, categoryNames);
      if (parsed.length === 0) {
        throw new Error("No transactions found in the PDF");
      }

      const categorized = categorizeTransactions(parsed, rules, categories);
      setTransactions(categorized);
      setStep("preview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process PDF");
      reset();
    }
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
          file_type: "pdf",
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
    setTransactions([]);
  }

  return (
    <>
      {step === "extracting" && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Processing PDF...</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Extracting text and identifying transactions with AI
          </p>
        </div>
      )}

      {step === "preview" && (
        <TransactionPreviewTable
          transactions={transactions}
          onConfirm={handleSave}
          onCancel={reset}
          saving={saving}
        />
      )}

      {step === "upload" && (
        <FileUploadZone
          accept=".pdf"
          onFile={handleFile}
          label="Drop your PDF statement here"
          description="Uses AI to extract transactions from bank/credit card PDFs"
        />
      )}
    </>
  );
}
