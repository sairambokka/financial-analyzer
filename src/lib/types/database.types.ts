// Simplified database types for SQLite (single-user, no user_id)

export type Category = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type CategoryRule = {
  id: string;
  category_id: string;
  pattern: string;
  created_at: string;
};

export type Statement = {
  id: string;
  file_name: string;
  file_type: string | null;
  storage_path: string | null;
  upload_date: string;
  period_start: string | null;
  period_end: string | null;
};

export type Transaction = {
  id: string;
  statement_id: string | null;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  category_id: string | null;
  raw_text: string | null;
  created_at: string;
};
