"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import type { CategoryTrendData } from "@/lib/analytics";

interface CategoryTrendChartProps {
  data: CategoryTrendData;
}

export function CategoryTrendChart({ data }: CategoryTrendChartProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (theme === "dark" || (theme === "system" && systemTheme === "dark"));
  const textColor = isDark ? "#ffffff" : "#1f2937";

  if (data.data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm">Category Spending Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No trend data available</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Upload statements spanning multiple months
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Category Spending Trends</CardTitle>
          <p className="text-xs text-muted-foreground">
            Monthly breakdown of top categories
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600 }}
                itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                formatter={(value: number | undefined) =>
                  value !== undefined
                    ? `$${value.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : ""
                }
              />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: "12px",
                }}
                iconType="square"
              />
              {data.categoryNames.map((categoryName) => (
                <Area
                  key={categoryName}
                  type="monotone"
                  dataKey={categoryName}
                  stackId="1"
                  stroke={data.categoryColors[categoryName]}
                  fill={data.categoryColors[categoryName]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
