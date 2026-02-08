"use client";

import { ArrowLeftRight, DollarSign, TrendingDown, TrendingUp, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { Summary } from "@/lib/analytics";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface SummaryCardsProps {
  summary: Summary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { totalIncome, totalExpenses, netBalance, count, transferCount } = summary;

  const cards = [
    {
      label: "Income",
      value: `$${fmt(totalIncome)}`,
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "Expenses",
      value: `$${fmt(totalExpenses)}`,
      icon: TrendingDown,
      color: "text-red-500 dark:text-red-400",
      iconBg: "bg-red-500/10",
    },
    {
      label: "Net Balance",
      value: `${netBalance >= 0 ? "" : "-"}$${fmt(Math.abs(netBalance))}`,
      icon: DollarSign,
      color: netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
      iconBg: netBalance >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
    {
      label: "Transactions",
      value: count.toLocaleString(),
      subtitle: transferCount > 0 ? `${transferCount} transfer${transferCount === 1 ? "" : "s"} excluded` : undefined,
      icon: transferCount > 0 ? ArrowLeftRight : Hash,
      color: "text-muted-foreground",
      iconBg: "bg-accent-blue/10",
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
        >
          <Card className="py-4 transition-shadow duration-200 hover:shadow-md">
            <CardContent className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${c.iconBg} ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`text-lg font-semibold ${c.color}`}>{c.value}</p>
                {c.subtitle && (
                  <p className="text-[10px] text-muted-foreground">{c.subtitle}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
