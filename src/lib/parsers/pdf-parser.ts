import type { ParsedTransaction } from "@/lib/types/parsing.types";

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // Set the worker source to the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n\n");
}

export async function structureWithClaude(
  text: string,
  categoryNames?: string[]
): Promise<ParsedTransaction[]> {
  const response = await fetch("/api/parse-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, categoryNames }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to process PDF with AI");
  }

  const { transactions } = await response.json();

  return transactions.map(
    (t: {
      date: string;
      description: string;
      amount: number;
      type: "credit" | "debit";
      category?: string;
    }) => ({
      date: t.date,
      description: t.description,
      amount: Math.round(Math.abs(t.amount) * 100) / 100,
      type: t.type === "credit" ? "credit" : "debit",
      raw_text: `${t.date} ${t.description} ${t.amount}`,
      suggested_category: t.category,
    })
  );
}
