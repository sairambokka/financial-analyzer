export interface ParsedRow {
  [key: string]: string;
}

export interface ColumnMappings {
  date: string;
  description: string;
  amount: string;
  type?: string; // optional: some CSVs have separate credit/debit columns
  credit?: string;
  debit?: string;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  raw_text: string;
  suggested_category?: string;
}

export interface CategorizedTransaction extends ParsedTransaction {
  category_id: string | null;
  category_name: string | null;
}
