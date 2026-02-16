"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import type { SpendingAnomaly } from "@/lib/analytics";

interface SpendingAnomaliesProps {
  data: SpendingAnomaly[];
}

export function SpendingAnomalies({ data }: SpendingAnomaliesProps) {
  if (data.length === 0) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            Spending Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              No unusual spending detected
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Your spending patterns look normal
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <AlertCircle className="h-5 w-5" />
            Spending Alerts
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Unusual spending patterns detected
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {data.map((anomaly, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 ${
                    anomaly.type === "spike"
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-blue-500/30 bg-blue-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {anomaly.type === "spike" ? (
                          <TrendingUp className="h-4 w-4 text-red-500 dark:text-red-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        )}
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${anomaly.categoryColor}20`,
                            color: anomaly.categoryColor,
                          }}
                        >
                          {anomaly.categoryName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{anomaly.month}</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <p>
                          Spent{" "}
                          <span className="font-semibold text-foreground">
                            ${anomaly.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>{" "}
                          vs avg{" "}
                          <span className="font-semibold">
                            ${anomaly.average.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          anomaly.type === "spike"
                            ? "text-red-500 dark:text-red-400"
                            : "text-blue-500 dark:text-blue-400"
                        }`}
                      >
                        {anomaly.percentAboveAvg >= 0 ? "+" : ""}
                        {anomaly.percentAboveAvg.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.abs(anomaly.zScore).toFixed(1)}σ
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
