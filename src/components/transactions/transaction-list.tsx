"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditCategoryDialog } from "./edit-category-dialog";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database.types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

const ALL = "__all__";

interface TransactionListProps {
  userId: string;
}

export function TransactionList({ userId }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState(ALL);
  const [filterType, setFilterType] = useState(ALL);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const txRes = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(500)
        .returns<Transaction[]>();

      const catRes = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .order("name")
        .returns<Category[]>();

      if (txRes.error) throw new Error(txRes.error.message);
      if (catRes.error) throw new Error(catRes.error.message);

      setTransactions(txRes.data);
      setCategories(catRes.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete(txId: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("transactions").delete().eq("id", txId);
      if (error) throw new Error(error.message);
      setTransactions((prev) => prev.filter((t) => t.id !== txId));
      toast.success("Transaction deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const filtered = transactions.filter((tx) => {
    if (filterCategory !== ALL && tx.category_id !== filterCategory) return false;
    if (filterType !== ALL && tx.type !== filterType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No transactions yet. Upload a statement to get started.
      </p>
    );
  }

  return (
    <>
      <EditCategoryDialog
        open={editTx !== null}
        onOpenChange={(open) => {
          if (!open) setEditTx(null);
        }}
        transaction={editTx}
        categories={categories}
        onSaved={fetchData}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground">
            {filtered.length} of {transactions.length} transactions
          </span>
        </div>

        <ScrollArea className="h-[500px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px] text-right">Amount</TableHead>
                <TableHead className="w-[80px]">Type</TableHead>
                <TableHead className="w-[140px]">Category</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tx) => {
                const cat = tx.category_id ? categoryMap.get(tx.category_id) : null;
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs">{tx.date}</TableCell>
                    <TableCell className="max-w-[250px] truncate text-sm">
                      {tx.description}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      ${Number(tx.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.type === "credit" ? "default" : "secondary"}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cat ? (
                        <Badge
                          variant="outline"
                          style={{ borderColor: cat.color, color: cat.color }}
                        >
                          {cat.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditTx(tx)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(tx.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </>
  );
}
