"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CategorizedTransaction } from "@/lib/types/parsing.types";

interface TransactionPreviewTableProps {
  transactions: CategorizedTransaction[];
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}

export function TransactionPreviewTable({
  transactions,
  onConfirm,
  onCancel,
  saving,
}: TransactionPreviewTableProps) {
  const totalCredit = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalDebit = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">
            {transactions.length} transactions found
          </h3>
          <p className="text-xs text-muted-foreground">
            Credits: ${totalCredit.toFixed(2)} · Debits: ${totalDebit.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onConfirm} disabled={saving || transactions.length === 0}>
            {saving ? "Saving..." : "Save Transactions"}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px] text-right">Amount</TableHead>
              <TableHead className="w-[80px]">Type</TableHead>
              <TableHead className="w-[130px]">Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs">{tx.date}</TableCell>
                <TableCell className="max-w-[250px] truncate text-sm">
                  {tx.description}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  ${tx.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant={tx.type === "credit" ? "default" : "secondary"}>
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {tx.category_name ?? "Uncategorized"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
