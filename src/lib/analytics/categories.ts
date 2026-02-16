import type { Transaction, Category } from "@/lib/types/database.types";
import { CategoryBreakdown, CategoryTrendData } from "./types";
import { isTransfer, getTransferCategoryIds, getMonthKey, formatMonthKey } from "./helpers";

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

export function calcIncomeBreakdown(
  txs: Transaction[],
  categories: Category[]
): CategoryBreakdown[] {
  const transferIds = getTransferCategoryIds(categories);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const totals = new Map<string, { name: string; color: string; amount: number }>();

  for (const tx of txs) {
    if (tx.type !== "credit") continue;
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

export function calcCategoryTrends(
  txs: Transaction[],
  categories: Category[],
  topN = 5
): CategoryTrendData {
  const transferIds = getTransferCategoryIds(categories);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // First, calculate total spending per category to identify top N
  const categoryTotals = new Map<string, number>();

  for (const tx of txs) {
    if (tx.type !== "debit") continue;
    if (isTransfer(tx, transferIds)) continue;

    const catId = tx.category_id ?? "__uncategorized__";
    categoryTotals.set(catId, (categoryTotals.get(catId) ?? 0) + Number(tx.amount));
  }

  // Get top N categories by total spend
  const topCategories = Array.from(categoryTotals.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([id]) => id);

  const topCategorySet = new Set(topCategories);

  // Group by month and category
  const monthlyData = new Map<string, Record<string, number>>();

  for (const tx of txs) {
    if (tx.type !== "debit") continue;
    if (isTransfer(tx, transferIds)) continue;

    const monthKey = getMonthKey(tx.date);
    const catId = tx.category_id ?? "__uncategorized__";

    // Determine if this goes into a top category or "Other"
    const categoryKey = topCategorySet.has(catId)
      ? (catMap.get(catId)?.name ?? "Uncategorized")
      : "Other";

    const monthData = monthlyData.get(monthKey) ?? {};
    monthData[categoryKey] = (monthData[categoryKey] ?? 0) + Number(tx.amount);
    monthlyData.set(monthKey, monthData);
  }

  // Convert to array format for Recharts
  const data = Array.from(monthlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, values]) => ({
      month: formatMonthKey(monthKey),
      ...values,
    }));

  // Build category names and colors
  const categoryNames = topCategories.map(id =>
    catMap.get(id)?.name ?? "Uncategorized"
  );

  // Add "Other" if we have more categories than topN
  if (categoryTotals.size > topN) {
    categoryNames.push("Other");
  }

  const categoryColors: Record<string, string> = {};
  topCategories.forEach(id => {
    const cat = catMap.get(id);
    if (cat) {
      categoryColors[cat.name] = cat.color;
    } else {
      categoryColors["Uncategorized"] = "#94a3b8";
    }
  });
  categoryColors["Other"] = "#64748b";

  return { data, categoryNames, categoryColors };
}
