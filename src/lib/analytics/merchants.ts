import Fuse from "fuse.js";
import type { Transaction, Category } from "@/lib/types/database.types";
import { MerchantAnalysis } from "./types";
import { isTransfer, getTransferCategoryIds } from "./helpers";

/**
 * Normalize merchant description for grouping
 * - Lowercase
 * - Strip payment prefixes (POS, ACH, DEBIT, etc.)
 * - Strip trailing reference numbers and IDs
 * - Strip city/state patterns
 */
export function normalizeMerchantName(description: string): string {
  let normalized = description.toLowerCase().trim();

  // Strip common payment prefixes
  normalized = normalized.replace(/^(pos|ach|debit|credit|payment|purchase|transaction)\s+/gi, "");

  // Strip trailing reference numbers (e.g., "merchant #12345" -> "merchant")
  normalized = normalized.replace(/\s*#?\d{4,}$/g, "");

  // Strip trailing card last-4 patterns (e.g., "merchant xxxx1234")
  normalized = normalized.replace(/\s*x+\d{4}$/gi, "");

  // Strip city/state patterns at end (e.g., "merchant ca" or "merchant san francisco ca")
  normalized = normalized.replace(/\s+[a-z]{2}$/gi, "");

  // Strip common filler words
  normalized = normalized.replace(/\b(inc|llc|ltd|corp|co)\b\.?/gi, "");

  return normalized.trim();
}

export function calcTopMerchants(
  txs: Transaction[],
  categories: Category[],
  options: { topN?: number } = {}
): MerchantAnalysis[] {
  const { topN = 10 } = options;
  const transferIds = getTransferCategoryIds(categories);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Filter to debits (excluding transfers)
  const debits = txs.filter(tx => tx.type === "debit" && !isTransfer(tx, transferIds));

  if (debits.length === 0) {
    return [];
  }

  // Normalize all descriptions
  const normalizedTxs = debits.map(tx => ({
    ...tx,
    normalizedDesc: normalizeMerchantName(tx.description),
  }));

  // Fuzzy-group using Fuse.js
  const uniqueDescriptions = Array.from(new Set(normalizedTxs.map(t => t.normalizedDesc)));

  const fuse = new Fuse(uniqueDescriptions, {
    threshold: 0.3,
    includeScore: true,
  });

  // Group transactions by fuzzy-matched merchant
  const merchantGroups = new Map<string, typeof normalizedTxs>();

  for (const tx of normalizedTxs) {
    const results = fuse.search(tx.normalizedDesc);

    // Use the best match or the original if no good match
    const bestMatch = results.length > 0 && results[0].score! < 0.3
      ? results[0].item
      : tx.normalizedDesc;

    const group = merchantGroups.get(bestMatch) ?? [];
    group.push(tx);
    merchantGroups.set(bestMatch, group);
  }

  // Aggregate merchant data
  const merchantData: MerchantAnalysis[] = [];

  for (const [merchantName, group] of merchantGroups.entries()) {
    const totalAmount = group.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const count = group.length;
    const avgAmount = totalAmount / count;

    // Find most common category
    const categoryFreq = new Map<string, number>();
    for (const tx of group) {
      if (tx.category_id) {
        categoryFreq.set(tx.category_id, (categoryFreq.get(tx.category_id) ?? 0) + 1);
      }
    }

    const mostCommonCatId = Array.from(categoryFreq.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    const category = mostCommonCatId ? catMap.get(mostCommonCatId) : null;
    const categoryName = category?.name ?? "Uncategorized";
    const categoryColor = category?.color ?? "#94a3b8";

    // Latest transaction date
    const sortedDates = group.map(tx => tx.date).sort().reverse();
    const lastDate = sortedDates[0];

    merchantData.push({
      merchantName,
      totalAmount,
      count,
      avgAmount,
      categoryName,
      categoryColor,
      lastDate,
    });
  }

  // Sort by total amount and return top N
  return merchantData
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, topN);
}
