import type { Transaction } from "@/lib/types/database.types";

export const TRANSFER_CATEGORY_NAME = "Transfer";

export interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  count: number;
  transferCount: number;
}

export interface EnhancedSummary extends Summary {
  incomeChange: number | null;     // MoM % change (null if insufficient data)
  expensesChange: number | null;
  savingsRate: number;             // (income - expenses) / income * 100
  avgTransaction: number;          // mean debit amount (excl. transfers)
  monthlyNetTrend: number[];       // last 6 months net balance for sparkline
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

export interface CategoryTrendData {
  data: Array<Record<string, number | string>>;  // { month: string, [categoryName]: amount }
  categoryNames: string[];
  categoryColors: Record<string, string>;
}

export interface RecurringGroup {
  description: string;           // normalized merchant name
  transactions: Transaction[];
  avgAmount: number;
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "irregular";
  intervalDays: number;
  monthlyEstimate: number;       // projected monthly cost
  lastDate: string;
  count: number;
  confidence: number;            // 0-1
}

export interface SpendingAnomaly {
  month: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  average: number;
  zScore: number;
  percentAboveAvg: number;
  type: "spike" | "drop";
}

export interface SpendingForecast {
  data: Array<{
    month: string;
    actual?: number;
    forecast?: number;
    upper?: number;
    lower?: number;
  }>;
  trend: "increasing" | "decreasing" | "stable";
  nextMonthEstimate: number;
  r2: number;
}

export interface MerchantAnalysis {
  merchantName: string;
  totalAmount: number;
  count: number;
  avgAmount: number;
  categoryName: string;
  categoryColor: string;
  lastDate: string;
}
