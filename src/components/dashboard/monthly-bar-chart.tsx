"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { MonthlyTrend } from "@/lib/analytics";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-sm font-semibold" style={{ color: item.color }}>
          {item.name}: ${Number(item.value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
}

interface MonthlyBarChartProps {
  data: MonthlyTrend[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (theme === "dark" || (theme === "system" && systemTheme === "dark"));
  const textColor = isDark ? "#ffffff" : "#1f2937";

  if (data.length === 0) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-sm">Monthly Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No data</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Upload statements to see monthly trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      className="flex-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Monthly Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <XAxis
                dataKey="month"
                stroke="hsl(var(--border))"
                tick={{ fill: textColor, fontSize: 12 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                stroke="hsl(var(--border))"
                tick={{ fill: textColor, fontSize: 12 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "var(--muted)", opacity: 0.1 }}
              />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
