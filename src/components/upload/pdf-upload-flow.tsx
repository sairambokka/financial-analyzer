"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Key, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadZone } from "./file-upload-zone";
import { TransactionPreviewTable } from "./transaction-preview-table";
import { ApiKeyDialog } from "./api-key-dialog";
import { extractTextFromPDF, structureWithClaude } from "@/lib/parsers/pdf-parser";
import { categorizeTransactions } from "@/lib/categorizer";
import { uploadStatementFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { useApiKey } from "@/hooks/use-api-key";
import type { CategorizedTransaction } from "@/lib/types/parsing.types";
import type { Database } from "@/lib/types/database.types";

type CategoryRule = Database["public"]["Tables"]["category_rules"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

type Step = "upload" | "extracting" | "preview";

interface PDFUploadFlowProps {
  userId: string;
  rules: CategoryRule[];
  categories: Category[];
  onComplete: () => void;
}

export function PDFUploadFlow({ userId, rules, categories, onComplete }: PDFUploadFlowProps) {
  const { apiKey, setApiKey, clearApiKey, hasKey } = useApiKey();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<CategorizedTransaction[]>([]);
  const [saving, setSaving] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  async function handleFile(f: File) {
    if (!hasKey) {
      setKeyDialogOpen(true);
      toast.error("Please configure your Anthropic API key first");
      return;
    }

    setFile(f);
    setStep("extracting");

    try {
      const text = await extractTextFromPDF(f);
      if (!text.trim()) {
        throw new Error("No text could be extracted from the PDF");
      }

      const categoryNames = categories.map((c) => c.name);
      const parsed = await structureWithClaude(text, apiKey, categoryNames);
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
      const supabase = createClient();

      const { data: stmt, error: stmtErr } = await supabase
        .from("statements")
        .insert({
          user_id: userId,
          file_name: file.name,
          file_type: "pdf",
          period_start: transactions.length > 0 ? transactions[transactions.length - 1].date : null,
          period_end: transactions.length > 0 ? transactions[0].date : null,
        })
        .select("id")
        .single();

      if (stmtErr || !stmt) throw new Error(stmtErr?.message ?? "Failed to create statement");

      const storagePath = await uploadStatementFile(supabase, userId, stmt.id, file);

      await supabase
        .from("statements")
        .update({ storage_path: storagePath })
        .eq("id", stmt.id);

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
    setTransactions([]);
  }

  return (
    <>
      <ApiKeyDialog
        open={keyDialogOpen}
        onOpenChange={setKeyDialogOpen}
        currentKey={apiKey}
        onSave={setApiKey}
        onClear={clearApiKey}
      />

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
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKeyDialogOpen(true)}
            >
              <Key className="mr-1.5 h-3.5 w-3.5" />
              {hasKey ? "API Key Configured" : "Set API Key"}
            </Button>
          </div>
          <FileUploadZone
            accept=".pdf"
            onFile={handleFile}
            label="Drop your PDF statement here"
            description="Uses AI to extract transactions from bank/credit card PDFs"
          />
        </div>
      )}
    </>
  );
}
