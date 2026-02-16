import regression from "regression";
import { mean, standardDeviation } from "simple-statistics";
import type { Transaction, Category } from "@/lib/types/database.types";
import { MonthlyTrend, SpendingForecast } from "./types";
import { isTransfer, getTransferCategoryIds, getMonthKey, formatMonthKey } from "./helpers";

export function calcMonthlyTrend(txs: Transaction[], categories: Category[]): MonthlyTrend[] {
  const transferIds = getTransferCategoryIds(categories);
  const months = new Map<string, { income: number; expenses: number }>();

  for (const tx of txs) {
    if (isTransfer(tx, transferIds)) continue;

    const key = getMonthKey(tx.date);

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
    .map(([key, val]) => ({
      month: formatMonthKey(key),
      income: val.income,
      expenses: val.expenses,
    }));
}

export function calcSpendingForecast(
  txs: Transaction[],
  categories: Category[],
  forecastMonths = 3
): SpendingForecast {
  const transferIds = getTransferCategoryIds(categories);

  // Calculate monthly expense totals
  const monthlyExpenses = new Map<string, number>();

  for (const tx of txs) {
    if (tx.type !== "debit") continue;
    if (isTransfer(tx, transferIds)) continue;

    const monthKey = getMonthKey(tx.date);
    monthlyExpenses.set(monthKey, (monthlyExpenses.get(monthKey) ?? 0) + Number(tx.amount));
  }

  const sortedMonths = Array.from(monthlyExpenses.entries()).sort(([a], [b]) => a.localeCompare(b));

  if (sortedMonths.length < 3) {
    // Not enough data for meaningful forecast
    return {
      data: sortedMonths.map(([monthKey, amount]) => ({
        month: formatMonthKey(monthKey),
        actual: amount,
      })),
      trend: "stable",
      nextMonthEstimate: sortedMonths.length > 0 ? sortedMonths[sortedMonths.length - 1][1] : 0,
      r2: 0,
    };
  }

  // Prepare data for regression (x = month index, y = expense amount)
  const regressionData: [number, number][] = sortedMonths.map(([, amount], idx) => [idx, amount]);

  const result = regression.linear(regressionData);
  const { equation, r2 } = result;
  const [slope, intercept] = equation;

  // Calculate residuals for confidence bands
  const residuals = regressionData.map(([x, y]) => y - (slope * x + intercept));
  const residualStdDev = residuals.length > 1 ? standardDeviation(residuals) : 0;
  const confidenceMargin = 1.5 * residualStdDev;

  // Determine trend
  const avgExpense = mean(sortedMonths.map(([, amt]) => amt));
  const slopePercent = (slope / avgExpense) * 100;

  let trend: "increasing" | "decreasing" | "stable";
  if (slopePercent > 2) {
    trend = "increasing";
  } else if (slopePercent < -2) {
    trend = "decreasing";
  } else {
    trend = "stable";
  }

  // Build forecast data
  const data: SpendingForecast["data"] = sortedMonths.map(([monthKey, amount]) => ({
    month: formatMonthKey(monthKey),
    actual: amount,
  }));

  // Add forecast months
  const lastMonthKey = sortedMonths[sortedMonths.length - 1][0];
  const [lastYear, lastMonth] = lastMonthKey.split("-").map(Number);

  for (let i = 1; i <= forecastMonths; i++) {
    const nextMonthIndex = sortedMonths.length + i - 1;
    const forecastValue = slope * nextMonthIndex + intercept;

    // Calculate next month key
    let nextMonth = lastMonth + i;
    let nextYear = lastYear;
    while (nextMonth > 12) {
      nextMonth -= 12;
      nextYear += 1;
    }
    const nextMonthKey = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;

    data.push({
      month: formatMonthKey(nextMonthKey),
      forecast: Math.max(0, forecastValue),
      upper: Math.max(0, forecastValue + confidenceMargin),
      lower: Math.max(0, forecastValue - confidenceMargin),
    });
  }

  const nextMonthEstimate = Math.max(0, slope * sortedMonths.length + intercept);

  return {
    data,
    trend,
    nextMonthEstimate,
    r2,
  };
}
