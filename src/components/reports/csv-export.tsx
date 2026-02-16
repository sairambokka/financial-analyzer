"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, PieChart, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Transaction, Category } from "@/lib/types/database.types";
import type { CategoryBreakdown, MonthlyTrend } from "@/lib/analytics";
import {
  exportTransactionsCSV,
  exportCategorySummaryCSV,
  exportMonthlySummaryCSV,
} from "@/lib/export";
import { toast } from "sonner";

interface CSVExportProps {
  transactions: Transaction[];
  categories: Category[];
  expenseBreakdown: CategoryBreakdown[];
  incomeBreakdown: CategoryBreakdown[];
  monthlyData: MonthlyTrend[];
}

export function CSVExport({
  transactions,
  categories,
  expenseBreakdown,
  incomeBreakdown,
  monthlyData,
}: CSVExportProps) {
  const handleExportTransactions = () => {
    try {
      exportTransactionsCSV(transactions, categories);
      toast.success("Transactions exported successfully");
    } catch (error) {
      toast.error("Failed to export transactions");
      console.error(error);
    }
  };

  const handleExportCategories = () => {
    try {
      exportCategorySummaryCSV(expenseBreakdown, incomeBreakdown);
      toast.success("Category summary exported successfully");
    } catch (error) {
      toast.error("Failed to export category summary");
      console.error(error);
    }
  };

  const handleExportMonthly = () => {
    try {
      exportMonthlySummaryCSV(monthlyData);
      toast.success("Monthly summary exported successfully");
    } catch (error) {
      toast.error("Failed to export monthly summary");
      console.error(error);
    }
  };

  const exportOptions = [
    {
      title: "All Transactions",
      description: "Export complete transaction history with categories",
      icon: FileText,
      count: transactions.length,
      handler: handleExportTransactions,
    },
    {
      title: "Category Summary",
      description: "Export income and expense breakdown by category",
      icon: PieChart,
      count: expenseBreakdown.length + incomeBreakdown.length,
      handler: handleExportCategories,
    },
    {
      title: "Monthly Summary",
      description: "Export monthly income, expenses, and savings rate",
      icon: TrendingUp,
      count: monthlyData.length,
      handler: handleExportMonthly,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Export Data</h2>
        <p className="text-sm text-muted-foreground">
          Download your financial data in CSV format
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {exportOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <motion.div
              key={option.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Icon className="h-8 w-8 text-accent-blue" />
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {option.count} {option.count === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={option.handler}
                    disabled={option.count === 0}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About CSV Exports</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            • CSV files can be opened in Excel, Google Sheets, or any spreadsheet application
          </p>
          <p>
            • All exports use the current date range filter from the dashboard
          </p>
          <p>
            • Transaction exports include date, description, amount, type, and category
          </p>
          <p>
            • Category summaries show totals and percentages for income and expenses
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
