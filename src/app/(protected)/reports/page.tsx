"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter, type DateRange } from "@/components/dashboard/date-range-filter";
import { MonthlyReport } from "@/components/reports/monthly-report";
import { CategoryReport } from "@/components/reports/category-report";
import { CSVExport } from "@/components/reports/csv-export";
import { filterByDateRange } from "@/lib/analytics/helpers";
import { calcCategoryBreakdown, calcIncomeBreakdown, calcMonthlyTrend } from "@/lib/analytics";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Transaction, Category } from "@/lib/types/database.types";
import type { CategoryBreakdown, MonthlyTrend } from "@/lib/analytics";

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

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
      } catch (error) {
        toast.error("Failed to load reports data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Apply date range filter
  const filtered = filterByDateRange(transactions, dateRange.start, dateRange.end);

  // Calculate analytics for export
  const expenseBreakdown: CategoryBreakdown[] =
    filtered.length > 0 ? calcCategoryBreakdown(filtered, categories) : [];
  const incomeBreakdown: CategoryBreakdown[] =
    filtered.length > 0 ? calcIncomeBreakdown(filtered, categories) : [];
  const monthlyData: MonthlyTrend[] =
    filtered.length > 0 ? calcMonthlyTrend(filtered, categories) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive financial reports and exports
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border rounded-lg border-dashed">
          <p className="text-sm text-muted-foreground">No data available</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Upload statements to generate reports
          </p>
        </div>
      ) : (
        <Tabs defaultValue="monthly" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="category">Category</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-6">
            <MonthlyReport transactions={filtered} categories={categories} />
          </TabsContent>

          <TabsContent value="category" className="space-y-6">
            <CategoryReport transactions={filtered} categories={categories} />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <CSVExport
              transactions={filtered}
              categories={categories}
              expenseBreakdown={expenseBreakdown}
              incomeBreakdown={incomeBreakdown}
              monthlyData={monthlyData}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
