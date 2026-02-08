"use client";


import { useMemo } from "react";
import { ResponsivePie } from "@nivo/pie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { CategoryBreakdown } from "@/lib/analytics";

interface CategoryPieChartProps {
  data: CategoryBreakdown[];
}

// Custom tooltip component for Nivo
const CustomTooltip = ({ datum }: { datum: any }) => {
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

export function CategoryPieChart({ data: rawData }: CategoryPieChartProps) {
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
        <CardHeader>
          <CardTitle className="text-sm">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No expense data</p>
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
        <CardHeader>
          <CardTitle className="text-lg font-bold">Spending by Category</CardTitle>
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
              arcLinkLabelsTextColor="var(--foreground)" // Use CSS variable for theme support
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: "color" }}
              arcLinkLabelsDiagonalLength={24} // Increased from 12
              arcLinkLabelsStraightLength={30} // Increased from 14

              // Slice Labels (text inside slices) only if slice is big enough
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
              enableArcLabels={false} // Disable inner labels for cleaner look like original, or set to true if desired

              tooltip={CustomTooltip}
              // Make sure text colors work in dark mode by using theme
              theme={{
                text: {
                  fill: "hsl(var(--foreground))",
                  fontSize: 14,
                  fontWeight: 600,
                },
                tooltip: {
                  container: {
                    background: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
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
