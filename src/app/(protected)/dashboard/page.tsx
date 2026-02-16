"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { MonthlyBarChart } from "@/components/dashboard/monthly-bar-chart";
import { CategoryTrendChart } from "@/components/dashboard/category-trend-chart";
import { ForecastChart } from "@/components/dashboard/forecast-chart";
import { DateRangeFilter, type DateRange } from "@/components/dashboard/date-range-filter";
import { TransactionList } from "@/components/transactions/transaction-list";
import { RecurringTransactions } from "@/components/insights/recurring-transactions";
import { SpendingAnomalies } from "@/components/insights/spending-anomalies";
import { TopMerchants } from "@/components/insights/top-merchants";
import {
  calcEnhancedSummary,
  calcCategoryBreakdown,
  calcIncomeBreakdown,
  calcMonthlyTrend,
  calcCategoryTrends,
  calcSpendingForecast,
  calcTopMerchants,
  detectRecurringTransactions,
  detectAnomalies,
  filterByDateRange,
} from "@/lib/analytics";
import type { Transaction, Category } from "@/lib/types/database.types";
import { AnimatePresence, motion } from "framer-motion";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [insightsExpanded, setInsightsExpanded] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [txRes, catRes] = await Promise.all([
          fetch("/api/transactions?limit=5000"),
          fetch("/api/categories"),
        ]);

        if (!txRes.ok || !catRes.ok) {
          throw new Error("Failed to load data");
        }

        const txData = await txRes.json();
        const catData = await catRes.json();

        setTransactions(txData);
        setCategories(catData);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(
    () => filterByDateRange(transactions, dateRange.start, dateRange.end),
    [transactions, dateRange]
  );

  const summary = useMemo(
    () => calcEnhancedSummary(transactions, filtered, categories),
    [transactions, filtered, categories]
  );
  const expenseBreakdown = useMemo(
    () => calcCategoryBreakdown(filtered, categories),
    [filtered, categories]
  );
  const incomeBreakdown = useMemo(
    () => calcIncomeBreakdown(filtered, categories),
    [filtered, categories]
  );
  const monthlyTrend = useMemo(() => calcMonthlyTrend(filtered, categories), [filtered, categories]);
  const categoryTrends = useMemo(() => calcCategoryTrends(filtered, categories), [filtered, categories]);

  // Insights (computed from all transactions, not filtered)
  const recurringGroups = useMemo(() => detectRecurringTransactions(transactions, categories), [transactions, categories]);
  const anomalies = useMemo(() => detectAnomalies(transactions, categories), [transactions, categories]);
  const topMerchants = useMemo(() => calcTopMerchants(filtered, categories), [filtered, categories]);
  const forecast = useMemo(() => calcSpendingForecast(transactions, categories), [transactions, categories]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[340px] rounded-xl" />
          <Skeleton className="h-[340px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold">No data yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload your bank or credit card statements to see your financial overview.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your financial overview and insights
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {/* Charts Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Analysis</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryPieChart expenseData={expenseBreakdown} incomeData={incomeBreakdown} />
            <MonthlyBarChart data={monthlyTrend} />
          </div>
        </div>

        <CategoryTrendChart data={categoryTrends} />
      </div>

      {/* Insights Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Insights & Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Advanced patterns, trends, and forecasting
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInsightsExpanded(!insightsExpanded)}
            className="w-full sm:w-auto"
          >
            {insightsExpanded ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Expand
              </>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {insightsExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="grid auto-rows-fr gap-4 lg:grid-cols-2">
                <RecurringTransactions data={recurringGroups} />
                <TopMerchants data={topMerchants} />
              </div>
              <div className="grid auto-rows-fr gap-4 lg:grid-cols-2">
                <SpendingAnomalies data={anomalies} />
                <ForecastChart data={forecast} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Separator className="my-8" />

      {/* Transactions Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Transactions</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} in selected period
          </p>
        </div>
        <TransactionList externalTransactions={filtered} externalCategories={categories} />
      </div>
    </div>
  );
}
