import type { Transaction, Category } from "@/lib/types/database.types";
import { TRANSFER_CATEGORY_NAME } from "./types";

export function isTransfer(tx: Transaction, transferCategoryIds: Set<string>): boolean {
  return !!tx.category_id && transferCategoryIds.has(tx.category_id);
}

export function getTransferCategoryIds(categories: Category[]): Set<string> {
  return new Set(
    categories
      .filter((c) => c.name === TRANSFER_CATEGORY_NAME)
      .map((c) => c.id)
  );
}

export function filterByDateRange(
  txs: Transaction[],
  start?: string | null,
  end?: string | null
): Transaction[] {
  return txs.filter((tx) => {
    if (start && tx.date < start) return false;
    if (end && tx.date > end) return false;
    return true;
  });
}

export function getMonthKey(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}
