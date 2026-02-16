import Papa from "papaparse";
import type { Transaction, Category } from "./types/database.types";
import type { CategoryBreakdown, MonthlyTrend } from "./analytics";

/**
 * Export all transactions to CSV
 */
export function exportTransactionsCSV(
  transactions: Transaction[],
  categories: Category[]
) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const data = transactions.map((tx) => ({
    Date: tx.date,
    Description: tx.description,
    Amount: tx.amount.toFixed(2),
    Type: tx.type === "credit" ? "Income" : "Expense",
    Category: categoryMap.get(tx.category_id!) || "Unknown",
  }));

  const csv = Papa.unparse(data);
  downloadCSV(csv, `transactions-${getDateString()}.csv`);
}

/**
 * Export category summary to CSV
 */
export function exportCategorySummaryCSV(
  expenseBreakdown: CategoryBreakdown[],
  incomeBreakdown: CategoryBreakdown[]
) {
  const totalExpense = expenseBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = incomeBreakdown.reduce((sum, item) => sum + item.amount, 0);

  const expenseData = expenseBreakdown.map((item) => ({
    Type: "Expense",
    Category: item.name,
    Amount: item.amount.toFixed(2),
    Percentage: `${((item.amount / totalExpense) * 100).toFixed(1)}%`,
  }));

  const incomeData = incomeBreakdown.map((item) => ({
    Type: "Income",
    Category: item.name,
    Amount: item.amount.toFixed(2),
    Percentage: `${((item.amount / totalIncome) * 100).toFixed(1)}%`,
  }));

  const data = [...expenseData, ...incomeData];
  const csv = Papa.unparse(data);
  downloadCSV(csv, `category-summary-${getDateString()}.csv`);
}

/**
 * Export monthly summary to CSV
 */
export function exportMonthlySummaryCSV(monthlyData: MonthlyTrend[]) {
  const data = monthlyData.map((item) => ({
    Month: item.month,
    Income: item.income.toFixed(2),
    Expenses: item.expenses.toFixed(2),
    "Net Balance": (item.income - item.expenses).toFixed(2),
    "Savings Rate": item.income > 0
      ? `${(((item.income - item.expenses) / item.income) * 100).toFixed(1)}%`
      : "0%",
  }));

  const csv = Papa.unparse(data);
  downloadCSV(csv, `monthly-summary-${getDateString()}.csv`);
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get current date string for filename
 */
function getDateString(): string {
  return new Date().toISOString().split("T")[0];
}
