import type { ParsedTransaction, CategorizedTransaction } from "@/lib/types/parsing.types";
import type { CategoryRule, Category } from "@/lib/types/database.types";

export function categorizeTransactions(
  transactions: ParsedTransaction[],
  rules: CategoryRule[],
  categories: Category[]
): CategorizedTransaction[] {
  const categoryById = new Map(categories.map((c) => [c.id, c.name]));
  const categoryByName = new Map(
    categories.map((c) => [c.name.toLowerCase(), c])
  );

  return transactions.map((tx) => {
    const desc = tx.description.toLowerCase();

    // 1. Try user-defined rules first
    for (const rule of rules) {
      if (desc.includes(rule.pattern.toLowerCase())) {
        return {
          ...tx,
          category_id: rule.category_id,
          category_name: categoryById.get(rule.category_id) ?? null,
        };
      }
    }

    // 2. Fall back to AI-suggested category
    if (tx.suggested_category) {
      const match = categoryByName.get(tx.suggested_category.toLowerCase());
      if (match) {
        return {
          ...tx,
          category_id: match.id,
          category_name: match.name,
        };
      }
    }

    return { ...tx, category_id: null, category_name: null };
  });
}
