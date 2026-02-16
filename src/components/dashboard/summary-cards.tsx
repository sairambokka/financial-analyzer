"use client";

import { ArrowLeftRight, DollarSign, TrendingDown, TrendingUp, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { EnhancedSummary } from "@/lib/analytics";
import { Sparkline } from "./sparkline";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

interface SummaryCardsProps {
  summary: EnhancedSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const {
    totalIncome,
    totalExpenses,
    netBalance,
    count,
    transferCount,
    incomeChange,
    expensesChange,
    savingsRate,
    avgTransaction,
    monthlyNetTrend,
  } = summary;

  const cards = [
    {
      label: "Income",
      value: `$${fmt(totalIncome)}`,
      change: incomeChange,
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "Expenses",
      value: `$${fmt(totalExpenses)}`,
      change: expensesChange,
      icon: TrendingDown,
      color: "text-red-500 dark:text-red-400",
      iconBg: "bg-red-500/10",
    },
    {
      label: "Net Balance",
      value: `${netBalance >= 0 ? "" : "-"}$${fmt(Math.abs(netBalance))}`,
      subtitle: `Savings rate: ${savingsRate.toFixed(1)}%`,
      sparklineData: monthlyNetTrend,
      icon: DollarSign,
      color: netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
      iconBg: netBalance >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
    {
      label: "Transactions",
      value: count.toLocaleString(),
      subtitle: `Avg: $${fmt(avgTransaction)}`,
      icon: transferCount > 0 ? ArrowLeftRight : Hash,
      color: "text-muted-foreground",
      iconBg: "bg-accent-blue/10",
      footer: transferCount > 0 ? `${transferCount} transfer${transferCount === 1 ? "" : "s"} excluded` : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.08, ease: "easeOut" }}
          className="h-full"
        >
          <Card className="h-full py-4 transition-shadow duration-200 hover:shadow-md">
            <CardContent className="flex h-full flex-col justify-between gap-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2.5 ${c.iconBg} ${c.color}`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className={`text-lg font-semibold ${c.color}`}>{c.value}</p>
                  </div>
                </div>
                {c.sparklineData && c.sparklineData.length > 0 && (
                  <div className="mt-1">
                    <Sparkline
                      data={c.sparklineData}
                      color={netBalance >= 0 ? "#10b981" : "#ef4444"}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                {c.change !== null && c.change !== undefined && (
                  <div className="flex items-center gap-1 text-xs">
                    {c.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 dark:text-red-400" />
                    )}
                    <span
                      className={
                        c.change >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500 dark:text-red-400"
                      }
                    >
                      {formatPercent(c.change)}
                    </span>
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                )}
                {c.subtitle && (
                  <p className="text-[10px] text-muted-foreground">{c.subtitle}</p>
                )}
                {c.footer && (
                  <p className="text-[10px] text-muted-foreground italic">{c.footer}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
