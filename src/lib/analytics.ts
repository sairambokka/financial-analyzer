import type { Database } from "@/lib/types/database.types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export const TRANSFER_CATEGORY_NAME = "Transfer";

export interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  count: number;
  transferCount: number;
}

export interface CategoryBreakdown {
  name: string;
  color: string;
  amount: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

function isTransfer(tx: Transaction, transferCategoryIds: Set<string>): boolean {
  return !!tx.category_id && transferCategoryIds.has(tx.category_id);
}

function getTransferCategoryIds(categories: Category[]): Set<string> {
  return new Set(
    categories
      .filter((c) => c.name === TRANSFER_CATEGORY_NAME)
      .map((c) => c.id)
  );
}

export function calcSummary(txs: Transaction[], categories: Category[]): Summary {
  const transferIds = getTransferCategoryIds(categories);
  let totalIncome = 0;
  let totalExpenses = 0;
  let transferCount = 0;

  for (const tx of txs) {
    if (isTransfer(tx, transferIds)) {
      transferCount++;
      continue;
    }
    const amt = Number(tx.amount);
    if (tx.type === "credit") {
      totalIncome += amt;
    } else {
      totalExpenses += amt;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    count: txs.length,
    transferCount,
  };
}

export function calcCategoryBreakdown(
  txs: Transaction[],
  categories: Category[]
): CategoryBreakdown[] {
  const transferIds = getTransferCategoryIds(categories);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const totals = new Map<string, { name: string; color: string; amount: number }>();

  for (const tx of txs) {
    if (tx.type !== "debit") continue;
    if (isTransfer(tx, transferIds)) continue;

    const cat = tx.category_id ? catMap.get(tx.category_id) : null;
    const key = cat?.id ?? "__uncategorized__";
    const name = cat?.name ?? "Uncategorized";
    const color = cat?.color ?? "#94a3b8";

    const existing = totals.get(key);
    if (existing) {
      existing.amount += Number(tx.amount);
    } else {
      totals.set(key, { name, color, amount: Number(tx.amount) });
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
}

export function calcMonthlyTrend(txs: Transaction[], categories: Category[]): MonthlyTrend[] {
  const transferIds = getTransferCategoryIds(categories);
  const months = new Map<string, { income: number; expenses: number }>();

  for (const tx of txs) {
    if (isTransfer(tx, transferIds)) continue;

    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const existing = months.get(key) ?? { income: 0, expenses: 0 };
    if (tx.type === "credit") {
      existing.income += Number(tx.amount);
    } else {
      existing.expenses += Number(tx.amount);
    }
    months.set(key, existing);
  }

  return Array.from(months.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [year, month] = key.split("-");
      const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      return { month: label, income: val.income, expenses: val.expenses };
    });
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
