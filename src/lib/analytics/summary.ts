import type { Transaction, Category } from "@/lib/types/database.types";
import { Summary, EnhancedSummary } from "./types";
import { isTransfer, getTransferCategoryIds, getMonthKey } from "./helpers";

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

export function calcEnhancedSummary(
  allTxs: Transaction[],
  filteredTxs: Transaction[],
  categories: Category[]
): EnhancedSummary {
  const transferIds = getTransferCategoryIds(categories);

  // Base summary from filtered transactions
  const base = calcSummary(filteredTxs, categories);

  // Calculate MoM change
  const monthlyTotals = new Map<string, { income: number; expenses: number }>();

  for (const tx of allTxs) {
    if (isTransfer(tx, transferIds)) continue;

    const monthKey = getMonthKey(tx.date);
    const existing = monthlyTotals.get(monthKey) ?? { income: 0, expenses: 0 };

    const amt = Number(tx.amount);
    if (tx.type === "credit") {
      existing.income += amt;
    } else {
      existing.expenses += amt;
    }
    monthlyTotals.set(monthKey, existing);
  }

  // Sort months to get current and previous
  const sortedMonths = Array.from(monthlyTotals.entries()).sort(([a], [b]) =>
    b.localeCompare(a) // Descending order
  );

  let incomeChange: number | null = null;
  let expensesChange: number | null = null;

  if (sortedMonths.length >= 2) {
    const [, current] = sortedMonths[0];
    const [, previous] = sortedMonths[1];

    if (previous.income > 0) {
      incomeChange = ((current.income - previous.income) / previous.income) * 100;
    }
    if (previous.expenses > 0) {
      expensesChange = ((current.expenses - previous.expenses) / previous.expenses) * 100;
    }
  }

  // Savings rate
  const savingsRate = base.totalIncome > 0
    ? ((base.totalIncome - base.totalExpenses) / base.totalIncome) * 100
    : 0;

  // Average transaction (debits only, excl transfers)
  const debits = filteredTxs.filter(tx => tx.type === "debit" && !isTransfer(tx, transferIds));
  const avgTransaction = debits.length > 0
    ? debits.reduce((sum, tx) => sum + Number(tx.amount), 0) / debits.length
    : 0;

  // Monthly net trend for last 6 months (for sparkline)
  const last6Months = sortedMonths.slice(0, 6).reverse(); // Chronological order
  const monthlyNetTrend = last6Months.map(([, data]) => data.income - data.expenses);

  return {
    ...base,
    incomeChange,
    expensesChange,
    savingsRate,
    avgTransaction,
    monthlyNetTrend,
  };
}

export function calcSavingsRate(income: number, expenses: number): number {
  return income > 0 ? ((income - expenses) / income) * 100 : 0;
}
