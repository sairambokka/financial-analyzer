"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import type { Transaction, Category } from "@/lib/types/database.types";
import { getMonthKey } from "@/lib/analytics/helpers";

interface MonthlyReportProps {
  transactions: Transaction[];
  categories: Category[];
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
  topCategories: { name: string; amount: number; color: string }[];
  topMerchants: { name: string; amount: number; count: number }[];
}

export function MonthlyReport({ transactions, categories }: MonthlyReportProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }]));

  // Group transactions by month
  const monthlyMap = new Map<string, Transaction[]>();
  transactions.forEach((tx) => {
    if (!tx.date) return;
    const month = getMonthKey(tx.date);
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, []);
    }
    monthlyMap.get(month)!.push(tx);
  });

  // Calculate monthly data
  const monthlyData: MonthlyData[] = Array.from(monthlyMap.entries())
    .map(([month, txs]) => {
      const income = txs
        .filter((tx) => tx.type === "credit")
        .reduce((sum, tx) => sum + tx.amount, 0);

      const expenses = txs
        .filter((tx) => tx.type === "debit")
        .reduce((sum, tx) => sum + tx.amount, 0);

      const net = income - expenses;
      const savingsRate = income > 0 ? (net / income) * 100 : 0;

      // Top 5 expense categories
      const categoryTotals = new Map<string, number>();
      txs
        .filter((tx) => tx.type === "debit" && tx.category_id)
        .forEach((tx) => {
          const current = categoryTotals.get(tx.category_id!) || 0;
          categoryTotals.set(tx.category_id!, current + tx.amount);
        });

      const topCategories = Array.from(categoryTotals.entries())
        .map(([catId, amount]) => ({
          name: categoryMap.get(catId)?.name || "Unknown",
          color: categoryMap.get(catId)?.color || "#94a3b8",
          amount,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Top 3 merchants
      const merchantTotals = new Map<string, { amount: number; count: number }>();
      txs
        .filter((tx) => tx.type === "debit")
        .forEach((tx) => {
          const merchant = tx.description.split(" ").slice(0, 3).join(" ");
          const current = merchantTotals.get(merchant) || { amount: 0, count: 0 };
          merchantTotals.set(merchant, {
            amount: current.amount + tx.amount,
            count: current.count + 1,
          });
        });

      const topMerchants = Array.from(merchantTotals.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

      return {
        month,
        income,
        expenses,
        net,
        savingsRate,
        topCategories,
        topMerchants,
      };
    })
    .sort((a, b) => b.month.localeCompare(a.month)); // Most recent first

  if (monthlyData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No data available</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Upload statements to see monthly reports
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Monthly Summary</h2>
        <p className="text-sm text-muted-foreground">
          Detailed breakdown for each month
        </p>
      </div>

      <div className="space-y-4">
        {monthlyData.map((data, index) => (
          <motion.div
            key={data.month}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{data.month}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={`${
                      data.net >= 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {data.net >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {data.savingsRate.toFixed(0)}% savings rate
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Income</p>
                    <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      ${data.income.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Expenses</p>
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                      ${data.expenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Net</p>
                    <p
                      className={`text-lg font-semibold ${
                        data.net >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      ${Math.abs(data.net).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Top Categories */}
                {data.topCategories.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Top Categories</p>
                    <div className="space-y-2">
                      {data.topCategories.map((cat) => (
                        <div key={cat.name} className="flex items-center gap-2">
                          <div
                            className="h-2 flex-1 rounded-full"
                            style={{
                              backgroundColor: cat.color,
                              width: `${(cat.amount / data.expenses) * 100}%`,
                              minWidth: "20%",
                            }}
                          />
                          <span className="text-xs font-medium w-24 text-right">
                            {cat.name}
                          </span>
                          <span className="text-xs text-muted-foreground w-20 text-right">
                            ${cat.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Merchants */}
                {data.topMerchants.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Top Merchants</p>
                    <div className="flex flex-wrap gap-2">
                      {data.topMerchants.map((merchant) => (
                        <Badge key={merchant.name} variant="outline" className="text-xs">
                          <DollarSign className="mr-1 h-3 w-3" />
                          {merchant.name} · ${merchant.amount.toFixed(0)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
