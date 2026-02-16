"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, Transaction } from "@/lib/types/database.types";

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  categories: Category[];
  onSaved: () => void;
}

export function EditCategoryDialog({
  open,
  onOpenChange,
  transaction,
  categories,
  onSaved,
}: EditCategoryDialogProps) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [createRule, setCreateRule] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleOpenChange(isOpen: boolean) {
    if (isOpen && transaction) {
      setCategoryId(transaction.category_id ?? "");
      setCreateRule(false);
    }
    onOpenChange(isOpen);
  }

  async function handleSave() {
    if (!transaction || !categoryId) return;
    setSaving(true);

    try {
      // Update transaction category
      const updateRes = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId }),
      });

      if (!updateRes.ok) throw new Error("Failed to update category");

      // Create persistent rule if checked
      if (createRule) {
        // Use first two words as pattern (or full description if short)
        const words = transaction.description.trim().split(/\s+/);
        const pattern = words.length <= 2
          ? transaction.description.trim()
          : words.slice(0, 2).join(" ");

        const ruleRes = await fetch("/api/category-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: categoryId,
            pattern: pattern.toLowerCase(),
          }),
        });

        if (!ruleRes.ok) {
          toast.error("Category saved but rule failed");
        } else {
          toast.success("Category updated and rule created");
        }
      } else {
        toast.success("Category updated");
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>

        {transaction && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground truncate">
              {transaction.description}
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create-rule"
                checked={createRule}
                onChange={(e) => setCreateRule(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="create-rule" className="text-sm">
                Remember this for similar transactions
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleSave} disabled={!categoryId || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
