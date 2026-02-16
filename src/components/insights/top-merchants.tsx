"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import type { MerchantAnalysis } from "@/lib/analytics";

interface TopMerchantsProps {
  data: MerchantAnalysis[];
}

export function TopMerchants({ data }: TopMerchantsProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if dark mode is active
  const isDark = mounted && (theme === "dark" || (theme === "system" && systemTheme === "dark"));
  const textColor = isDark ? "#ffffff" : "#1f2937";

  if (data.length === 0) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-sm">Top Merchants</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No merchant data available</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Upload statements to see where you spend
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for horizontal bar chart
  const chartData = data.map((merchant) => ({
    name: merchant.merchantName.slice(0, 20) + (merchant.merchantName.length > 20 ? "..." : ""),
    fullName: merchant.merchantName,
    amount: merchant.totalAmount,
    color: merchant.categoryColor,
    categoryName: merchant.categoryName,
    count: merchant.count,
  }));

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Top Merchants</CardTitle>
          <p className="text-xs text-muted-foreground">
            By total spending
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                stroke="hsl(var(--border))"
                tick={{ fill: textColor, fontSize: 14, fontWeight: 600 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--border))"
                tick={{ fill: textColor, fontSize: 14, fontWeight: 600 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                width={150}
                interval={0}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600 }}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                offset={20}
                formatter={(value, name, props) => {
                  if (typeof value !== "number" || !props.payload) return ["", ""];
                  const payload = props.payload as { fullName: string; count: number; categoryName: string };
                  return [
                    <>
                      <div className="text-xs text-muted-foreground mb-1 capitalize">
                        {payload.fullName}
                      </div>
                      <div className="font-semibold">
                        ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {payload.count} transaction{payload.count !== 1 ? "s" : ""} · {payload.categoryName}
                      </div>
                    </>,
                    "",
                  ];
                }}
                labelFormatter={() => ""}
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
