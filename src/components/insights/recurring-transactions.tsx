"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import type { RecurringGroup } from "@/lib/analytics";

interface RecurringTransactionsProps {
  data: RecurringGroup[];
}

function formatFrequency(frequency: RecurringGroup["frequency"]): string {
  const map: Record<RecurringGroup["frequency"], string> = {
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    irregular: "Irregular",
  };
  return map[frequency];
}

function getFrequencyColor(frequency: RecurringGroup["frequency"]): string {
  const map: Record<RecurringGroup["frequency"], string> = {
    weekly: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    biweekly: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    monthly: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    quarterly: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    irregular: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  };
  return map[frequency];
}

export function RecurringTransactions({ data }: RecurringTransactionsProps) {
  const totalMonthly = data.reduce((sum, group) => sum + group.monthlyEstimate, 0);

  if (data.length === 0) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-sm">Recurring & Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No recurring transactions detected</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Upload more statements to identify patterns
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
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Recurring & Subscriptions</CardTitle>
          <p className="text-xs text-muted-foreground">
            Total monthly recurring:{" "}
            <span className="font-semibold text-foreground">
              ${totalMonthly.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {data.map((group, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium capitalize">{group.description}</p>
                      <div
                        className={`h-2 w-2 rounded-full ${
                          group.confidence >= 0.8
                            ? "bg-emerald-500"
                            : group.confidence >= 0.6
                            ? "bg-yellow-500"
                            : "bg-orange-500"
                        }`}
                        title={`Confidence: ${(group.confidence * 100).toFixed(0)}%`}
                      />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className={getFrequencyColor(group.frequency)}>
                        {formatFrequency(group.frequency)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {group.count} transaction{group.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${group.monthlyEstimate.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">/month</p>
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
