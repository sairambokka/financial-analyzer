import Fuse from "fuse.js";
import { mean, standardDeviation } from "simple-statistics";
import type { Transaction, Category } from "@/lib/types/database.types";
import { RecurringGroup } from "./types";
import { isTransfer, getTransferCategoryIds } from "./helpers";
import { normalizeMerchantName } from "./merchants";

export function detectRecurringTransactions(
  txs: Transaction[],
  categories: Category[],
  options: { minOccurrences?: number; minConfidence?: number } = {}
): RecurringGroup[] {
  const { minOccurrences = 3, minConfidence = 0.5 } = options;
  const transferIds = getTransferCategoryIds(categories);

  // Filter to debits (excluding transfers)
  const debits = txs.filter(tx => tx.type === "debit" && !isTransfer(tx, transferIds));

  if (debits.length === 0) {
    return [];
  }

  // Normalize descriptions
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

    const bestMatch = results.length > 0 && results[0].score! < 0.3
      ? results[0].item
      : tx.normalizedDesc;

    const group = merchantGroups.get(bestMatch) ?? [];
    group.push(tx);
    merchantGroups.set(bestMatch, group);
  }

  // Analyze each group for recurring patterns
  const recurringGroups: RecurringGroup[] = [];

  for (const [merchantName, group] of merchantGroups.entries()) {
    if (group.length < minOccurrences) continue;

    // Sort by date
    const sortedGroup = group.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate intervals between consecutive transactions (in days)
    const intervals: number[] = [];
    for (let i = 1; i < sortedGroup.length; i++) {
      const prevDate = new Date(sortedGroup[i - 1].date);
      const currDate = new Date(sortedGroup[i].date);
      const daysDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      intervals.push(daysDiff);
    }

    if (intervals.length === 0) continue;

    const avgInterval = mean(intervals);
    const intervalStdDev = intervals.length > 1 ? standardDeviation(intervals) : 0;

    // Classify frequency based on average interval
    let frequency: RecurringGroup["frequency"];
    if (avgInterval >= 5 && avgInterval <= 9) {
      frequency = "weekly";
    } else if (avgInterval >= 12 && avgInterval <= 16) {
      frequency = "biweekly";
    } else if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = "monthly";
    } else if (avgInterval >= 85 && avgInterval <= 95) {
      frequency = "quarterly";
    } else {
      frequency = "irregular";
    }

    // Calculate confidence based on interval regularity and amount consistency
    const amounts = sortedGroup.map(tx => Number(tx.amount));
    const avgAmount = mean(amounts);
    const amountStdDev = amounts.length > 1 ? standardDeviation(amounts) : 0;

    // Interval confidence (1.0 if no deviation, decreases with higher stddev)
    const intervalConfidence = avgInterval > 0
      ? Math.max(0, 1 - (intervalStdDev / avgInterval))
      : 0;

    // Amount confidence (1.0 if all amounts are the same, decreases with variance)
    const amountConfidence = avgAmount > 0
      ? Math.max(0, 1 - (amountStdDev / avgAmount))
      : 0;

    // Overall confidence (weighted average, intervals more important)
    const confidence = 0.6 * intervalConfidence + 0.4 * amountConfidence;

    if (confidence < minConfidence) continue;

    // Estimate monthly cost
    let monthlyEstimate: number;
    if (frequency === "weekly") {
      monthlyEstimate = (avgAmount * 52) / 12;
    } else if (frequency === "biweekly") {
      monthlyEstimate = (avgAmount * 26) / 12;
    } else if (frequency === "monthly") {
      monthlyEstimate = avgAmount;
    } else if (frequency === "quarterly") {
      monthlyEstimate = avgAmount / 3;
    } else {
      // Irregular: estimate based on actual average monthly spend
      const firstDate = new Date(sortedGroup[0].date);
      const lastDate = new Date(sortedGroup[sortedGroup.length - 1].date);
      const monthsSpan = Math.max(1,
        (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      monthlyEstimate = (avgAmount * sortedGroup.length) / monthsSpan;
    }

    recurringGroups.push({
      description: merchantName,
      transactions: sortedGroup,
      avgAmount,
      frequency,
      intervalDays: Math.round(avgInterval),
      monthlyEstimate,
      lastDate: sortedGroup[sortedGroup.length - 1].date,
      count: sortedGroup.length,
      confidence,
    });
  }

  // Sort by monthly estimate (highest first)
  return recurringGroups.sort((a, b) => b.monthlyEstimate - a.monthlyEstimate);
}
