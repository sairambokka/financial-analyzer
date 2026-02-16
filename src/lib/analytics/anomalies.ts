import { mean, standardDeviation } from "simple-statistics";
import type { Transaction, Category } from "@/lib/types/database.types";
import { SpendingAnomaly } from "./types";
import { isTransfer, getTransferCategoryIds, getMonthKey, formatMonthKey } from "./helpers";

export function detectAnomalies(
  txs: Transaction[],
  categories: Category[],
  options: { threshold?: number; topN?: number } = {}
): SpendingAnomaly[] {
  const { threshold = 1.5, topN = 10 } = options;
  const transferIds = getTransferCategoryIds(categories);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Group debits by category and month (excluding transfers)
  const categoryMonthlyData = new Map<string, Map<string, number>>();

  for (const tx of txs) {
    if (tx.type !== "debit") continue;
    if (isTransfer(tx, transferIds)) continue;

    const catId = tx.category_id ?? "__uncategorized__";
    const monthKey = getMonthKey(tx.date);

    if (!categoryMonthlyData.has(catId)) {
      categoryMonthlyData.set(catId, new Map());
    }

    const monthlyData = categoryMonthlyData.get(catId)!;
    monthlyData.set(monthKey, (monthlyData.get(monthKey) ?? 0) + Number(tx.amount));
  }

  // Detect anomalies per category
  const anomalies: SpendingAnomaly[] = [];

  for (const [catId, monthlyData] of categoryMonthlyData.entries()) {
    const monthlyAmounts = Array.from(monthlyData.values());

    // Need at least 3 data points for meaningful statistics
    if (monthlyAmounts.length < 3) continue;

    const categoryMean = mean(monthlyAmounts);
    const categoryStdDev = standardDeviation(monthlyAmounts);

    // Skip if no variance
    if (categoryStdDev === 0) continue;

    // Calculate z-scores for each month
    for (const [monthKey, amount] of monthlyData.entries()) {
      const z = (amount - categoryMean) / categoryStdDev;

      if (Math.abs(z) >= threshold) {
        const cat = catId !== "__uncategorized__" ? catMap.get(catId) : null;
        const categoryName = cat?.name ?? "Uncategorized";
        const categoryColor = cat?.color ?? "#94a3b8";

        const percentAboveAvg = ((amount - categoryMean) / categoryMean) * 100;

        anomalies.push({
          month: formatMonthKey(monthKey),
          categoryName,
          categoryColor,
          amount,
          average: categoryMean,
          zScore: z,
          percentAboveAvg,
          type: z > 0 ? "spike" : "drop",
        });
      }
    }
  }

  // Sort by absolute z-score (most anomalous first) and take top N
  return anomalies
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
    .slice(0, topN);
}
