import Papa from "papaparse";
import type { ParsedRow, ColumnMappings, ParsedTransaction } from "@/lib/types/parsing.types";

export function parseCSVFile(file: File): Promise<{ headers: string[]; rows: ParsedRow[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        resolve({ headers, rows: results.data });
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`));
      },
    });
  });
}

const DATE_PATTERNS = ["date", "transaction date", "trans date", "posting date", "posted date", "value date"];
const DESC_PATTERNS = ["description", "desc", "narrative", "details", "memo", "transaction description", "particulars"];
const AMOUNT_PATTERNS = ["amount", "transaction amount", "value", "sum"];
const CREDIT_PATTERNS = ["credit", "credits", "deposit", "deposits", "money in"];
const DEBIT_PATTERNS = ["debit", "debits", "withdrawal", "withdrawals", "money out"];

function matchColumn(headers: string[], patterns: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const pattern of patterns) {
    const idx = lower.indexOf(pattern);
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

export function autoDetectColumns(headers: string[]): Partial<ColumnMappings> {
  return {
    date: matchColumn(headers, DATE_PATTERNS),
    description: matchColumn(headers, DESC_PATTERNS),
    amount: matchColumn(headers, AMOUNT_PATTERNS),
    credit: matchColumn(headers, CREDIT_PATTERNS),
    debit: matchColumn(headers, DEBIT_PATTERNS),
  };
}

function parseDate(value: string): string | null {
  const cleaned = value.trim();
  if (!cleaned) return null;

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    return cleaned.slice(0, 10);
  }

  // MM/DD/YYYY or M/D/YYYY
  const mdy = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (mdy) {
    return `${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
  }

  // DD/MM/YYYY — ambiguous, but we'll try parsing with Date
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return null;
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[$€£,\s]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function mapRowsToTransactions(
  rows: ParsedRow[],
  mappings: ColumnMappings
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  for (const row of rows) {
    const rawDate = row[mappings.date] ?? "";
    const date = parseDate(rawDate);
    if (!date) continue; // skip rows with no valid date

    const description = (row[mappings.description] ?? "").trim();
    if (!description) continue;

    let amount: number;
    let type: "credit" | "debit";

    if (mappings.credit && mappings.debit) {
      // Separate credit/debit columns
      const creditVal = parseAmount(row[mappings.credit] ?? "");
      const debitVal = parseAmount(row[mappings.debit] ?? "");
      if (creditVal > 0) {
        amount = creditVal;
        type = "credit";
      } else if (debitVal > 0) {
        amount = debitVal;
        type = "debit";
      } else {
        continue; // no amount
      }
    } else if (mappings.amount) {
      // Single amount column — positive = credit, negative = debit
      amount = parseAmount(row[mappings.amount] ?? "");
      if (amount === 0) continue;
      type = amount > 0 ? "credit" : "debit";
      amount = Math.abs(amount);
    } else {
      continue;
    }

    transactions.push({
      date,
      description,
      amount: Math.round(amount * 100) / 100,
      type,
      raw_text: Object.values(row).join(" | "),
    });
  }

  return transactions;
}
