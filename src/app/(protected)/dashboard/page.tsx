"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { MonthlyBarChart } from "@/components/dashboard/monthly-bar-chart";
import { DateRangeFilter, type DateRange } from "@/components/dashboard/date-range-filter";
import { TransactionList } from "@/components/transactions/transaction-list";
import { createClient } from "@/lib/supabase/client";
import {
  calcSummary,
  calcCategoryBreakdown,
  calcMonthlyTrend,
  filterByDateRange,
} from "@/lib/analytics";
import type { Database } from "@/lib/types/database.types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);

        const [txRes, catRes] = await Promise.all([
          supabase
            .from("transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(5000)
            .returns<Transaction[]>(),
          supabase
            .from("categories")
            .select("*")
            .eq("user_id", user.id)
            .order("name")
            .returns<Category[]>(),
        ]);

        if (txRes.error) throw new Error(txRes.error.message);
        if (catRes.error) throw new Error(catRes.error.message);

        setTransactions(txRes.data);
        setCategories(catRes.data);
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

  const summary = useMemo(() => calcSummary(filtered, categories), [filtered, categories]);
  const categoryBreakdown = useMemo(
    () => calcCategoryBreakdown(filtered, categories),
    [filtered, categories]
  );
  const monthlyTrend = useMemo(() => calcMonthlyTrend(filtered, categories), [filtered, categories]);

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

  if (!userId) return null;

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      <SummaryCards summary={summary} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryPieChart data={categoryBreakdown} />
        <MonthlyBarChart data={monthlyTrend} />
      </div>

      <Separator />

      <TransactionList userId={userId} />
    </div>
  );
}
