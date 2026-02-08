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
  apiKey: string,
  categoryNames?: string[]
): Promise<ParsedTransaction[]> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const categoryList = categoryNames?.length
    ? `\n\nAvailable categories: ${categoryNames.join(", ")}`
    : "";

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Extract all financial transactions from this bank/credit card statement text. Return ONLY a JSON array where each element has:
- "date": string in YYYY-MM-DD format
- "description": string describing the transaction
- "amount": positive number (no currency symbols)
- "type": either "credit" or "debit"
- "category": string — the best matching category from the list below

If a transaction is a payment, deposit, or refund, mark it as "credit". If it's a purchase, fee, or charge, mark it as "debit".

IMPORTANT — Credit card payments, balance transfers, inter-account transfers, and payments between accounts are NOT real income or expenses. They are just money moving between accounts. Categorize these as "Transfer". Examples:
- "PAYMENT RECEIVED" or "PAYMENT - THANK YOU" on a credit card statement
- "CREDIT CARD PAYMENT" or "ONLINE PAYMENT" on a bank statement
- ACH transfers, wire transfers between own accounts, Zelle/Venmo transfers to self

For "category", you MUST pick exactly one of these categories for each transaction. Use the category name exactly as written:${categoryList}

If none fit well, use "Other".

Statement text:
${text}

Return ONLY the JSON array, no other text.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response from Claude API");
  }

  // Extract JSON from response (handle possible markdown code blocks)
  let jsonStr = content.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed: Array<{
    date: string;
    description: string;
    amount: number;
    type: "credit" | "debit";
    category?: string;
  }> = JSON.parse(jsonStr);

  return parsed.map((t) => ({
    date: t.date,
    description: t.description,
    amount: Math.round(Math.abs(t.amount) * 100) / 100,
    type: t.type === "credit" ? "credit" : "debit",
    raw_text: `${t.date} ${t.description} ${t.amount}`,
    suggested_category: t.category,
  }));
}
