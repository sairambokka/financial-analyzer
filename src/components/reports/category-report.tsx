"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Transaction, Category } from "@/lib/types/database.types";
import { getMonthKey } from "@/lib/analytics/helpers";

interface CategoryReportProps {
  transactions: Transaction[];
  categories: Category[];
}

export function CategoryReport({ transactions, categories }: CategoryReportProps) {
  // Get categories that have expense transactions
  const categoryIds = new Set(
    transactions.filter((tx) => tx.type === "debit").map((tx) => tx.category_id)
  );
  const expenseCategories = categories.filter((c) => categoryIds.has(c.id));

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    expenseCategories[0]?.id || ""
  );

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  if (!selectedCategory || expenseCategories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No expense categories available</p>
      </div>
    );
  }

  // Filter transactions for selected category
  const categoryTransactions = transactions.filter(
    (tx) => tx.category_id === selectedCategoryId && tx.type === "debit"
  );

  // Calculate monthly totals
  const monthlyMap = new Map<string, number>();
  categoryTransactions.forEach((tx) => {
    const month = getMonthKey(new Date(tx.date));
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + tx.amount);
  });

  const monthlyData = Array.from(monthlyMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate statistics
  const totalAmount = categoryTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const avgMonthly =
    monthlyData.length > 0
      ? monthlyData.reduce((sum, m) => sum + m.amount, 0) / monthlyData.length
      : 0;
  const minMonth = monthlyData.length > 0 ? Math.min(...monthlyData.map((m) => m.amount)) : 0;
  const maxMonth = monthlyData.length > 0 ? Math.max(...monthlyData.map((m) => m.amount)) : 0;

  // Calculate trend
  let trend: "increasing" | "decreasing" | "stable" = "stable";
  if (monthlyData.length >= 2) {
    const firstHalf = monthlyData.slice(0, Math.floor(monthlyData.length / 2));
    const secondHalf = monthlyData.slice(Math.floor(monthlyData.length / 2));
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.amount, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.amount, 0) / secondHalf.length;
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (change > 5) trend = "increasing";
    else if (change < -5) trend = "decreasing";
  }

  const trendIcon =
    trend === "increasing" ? (
      <TrendingUp className="h-4 w-4" />
    ) : trend === "decreasing" ? (
      <TrendingDown className="h-4 w-4" />
    ) : (
      <Minus className="h-4 w-4" />
    );

  const trendColor =
    trend === "increasing"
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : trend === "decreasing"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : "bg-blue-500/10 text-blue-600 dark:text-blue-400";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Category Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Detailed breakdown by category
          </p>
        </div>
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div
        key={selectedCategoryId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                <div>
                  <CardTitle className="text-lg">{selectedCategory.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {categoryTransactions.length} transaction
                    {categoryTransactions.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className={`${trendColor} flex items-center gap-1`}>
                {trendIcon}
                {trend.charAt(0).toUpperCase() + trend.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">
                  ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg/Month</p>
                <p className="text-lg font-semibold">
                  ${avgMonthly.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Min Month</p>
                <p className="text-lg font-semibold">
                  ${minMonth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Max Month</p>
                <p className="text-lg font-semibold">
                  ${maxMonth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Trend Chart */}
            {monthlyData.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-3">Monthly Trend</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--border))"
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                      tickLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      stroke="hsl(var(--border))"
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                      tickLine={{ stroke: "hsl(var(--border))" }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                      formatter={(value: number | undefined) =>
                        value !== undefined
                          ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                          : ""
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke={selectedCategory.color}
                      strokeWidth={2}
                      dot={{ fill: selectedCategory.color, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent Transactions */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">
                Recent Transactions
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {categoryTransactions.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                    <p className="font-semibold text-red-600 dark:text-red-400 ml-4">
                      ${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
