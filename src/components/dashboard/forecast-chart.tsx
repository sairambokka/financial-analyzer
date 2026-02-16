"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import type { SpendingForecast } from "@/lib/analytics";

interface ForecastChartProps {
  data: SpendingForecast;
}

export function ForecastChart({ data }: ForecastChartProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (theme === "dark" || (theme === "system" && systemTheme === "dark"));
  const textColor = isDark ? "#ffffff" : "#1f2937";

  if (data.data.length === 0) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-sm">Spending Forecast</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Insufficient data for forecast</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Need at least 3 months of data
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trendIcon =
    data.trend === "increasing" ? (
      <TrendingUp className="h-4 w-4" />
    ) : data.trend === "decreasing" ? (
      <TrendingDown className="h-4 w-4" />
    ) : (
      <Minus className="h-4 w-4" />
    );

  const trendColor =
    data.trend === "increasing"
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : data.trend === "decreasing"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : "bg-blue-500/10 text-blue-600 dark:text-blue-400";

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Spending Forecast</CardTitle>
              <p className="text-xs text-muted-foreground">
                Next month estimate:{" "}
                <span className="font-semibold text-foreground">
                  ${data.nextMonthEstimate.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>
            <Badge variant="secondary" className={`${trendColor} flex items-center gap-1`}>
              {trendIcon}
              {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={data.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              />
              {/* Confidence band */}
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="#3b82f6"
                fillOpacity={0.1}
                name="Confidence Band"
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="#3b82f6"
                fillOpacity={0.1}
              />
              {/* Actual spending */}
              <Bar
                dataKey="actual"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Actual Spending"
              />
              {/* Forecast line */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#10b981", r: 4 }}
                name="Forecast"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-blue-500" />
              <span>Historical</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-0.5 w-6 border-t-2 border-dashed border-emerald-500" />
              <span>Forecast</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-blue-500/20" />
              <span>Confidence Band</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
