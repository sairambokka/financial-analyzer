"use client";

import { useMemo, useState, useEffect } from "react";
import { ResponsivePie } from "@nivo/pie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import type { CategoryBreakdown } from "@/lib/analytics";

interface CategoryPieChartProps {
  expenseData: CategoryBreakdown[];
  incomeData: CategoryBreakdown[];
}

// Custom tooltip component for Nivo
const CustomTooltip = ({ datum }: { datum: { id: string | number; value: number; color: string } }) => {
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: datum.color }}
        />
        <p className="text-xs font-medium text-popover-foreground">{datum.id}</p>
      </div>
      <p className="mt-1 text-sm font-semibold text-popover-foreground">
        ${Number(datum.value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
};

export function CategoryPieChart({ expenseData: rawExpenseData, incomeData: rawIncomeData }: CategoryPieChartProps) {
  const [mode, setMode] = useState<"expenses" | "income">("expenses");
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rawData = mode === "expenses" ? rawExpenseData : rawIncomeData;

  // Determine if dark mode is active
  const isDark = mounted && (theme === "dark" || (theme === "system" && systemTheme === "dark"));
  // Use very bright colors for dark mode visibility
  const textColor = isDark ? "#ffffff" : "#1f2937";
  const linkColor = isDark ? "#e5e7eb" : "#6b7280";

  // Group small categories to avoid cluttering the chart
  const data = useMemo(() => {
    if (rawData.length <= 10) {
      return rawData.map(d => ({
        id: d.name,
        label: d.name,
        value: d.amount,
        color: d.color
      }));
    }

    const sorted = [...rawData].sort((a, b) => b.amount - a.amount);
    const top = sorted.slice(0, 8);
    const others = sorted.slice(8);
    const othersAmount = others.reduce((sum, item) => sum + item.amount, 0);

    const result = top.map(d => ({
      id: d.name,
      label: d.name,
      value: d.amount,
      color: d.color,
    }));

    if (othersAmount > 0) {
      result.push({
        id: "Other",
        label: "Other",
        value: othersAmount,
        color: "#94a3b8", // slate-400
      });
    }
    return result;
  }, [rawData]);

  if (data.length === 0) {
    return (
      <Card className="flex-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm">Category Breakdown</CardTitle>
          <div className="inline-flex rounded-lg border border-border p-1">
            <button
              onClick={() => setMode("expenses")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                mode === "expenses"
                  ? "bg-accent-blue text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setMode("income")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                mode === "income"
                  ? "bg-accent-blue text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Income
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No {mode} data</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Upload statements to see category breakdown</p>
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
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-bold">Category Breakdown</CardTitle>
          <div className="inline-flex rounded-lg border border-border p-1">
            <button
              onClick={() => setMode("expenses")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                mode === "expenses"
                  ? "bg-accent-blue text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setMode("income")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                mode === "income"
                  ? "bg-accent-blue text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Income
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsivePie
              data={data}
              margin={{ top: 80, right: 90, bottom: 80, left: 90 }}
              startAngle={-90}
              endAngle={270}
              innerRadius={0.5}
              padAngle={2}
              cornerRadius={4}
              activeOuterRadiusOffset={8}
              colors={{ datum: "data.color" }}
              borderWidth={1}
              borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}

              // Link Labels (the lines outside)
              arcLinkLabelsSkipAngle={0}
              arcLinkLabelsTextColor={textColor}
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={linkColor}
              arcLinkLabelsDiagonalLength={24}
              arcLinkLabelsStraightLength={30}
              arcLinkLabelsTextOffset={6}

              // Slice Labels (text inside slices) only if slice is big enough
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
              enableArcLabels={false} // Disable inner labels for cleaner look like original, or set to true if desired

              tooltip={CustomTooltip}
              // Make sure text colors work in dark mode by using theme
              theme={{
                text: {
                  fill: textColor,
                  fontSize: 14,
                  fontWeight: 600,
                },
                labels: {
                  text: {
                    fill: textColor,
                    fontSize: 14,
                    fontWeight: 600,
                  },
                },
                tooltip: {
                  container: {
                    background: isDark ? "#2d3748" : "#ffffff",
                    color: textColor,
                    fontSize: "12px",
                    borderRadius: "6px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    padding: "8px 12px",
                  },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
