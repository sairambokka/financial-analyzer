import Database from "better-sqlite3";
import { randomUUID } from "crypto";

let db: Database.Database | null = null;

export function generateId(): string {
  return randomUUID();
}

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || "./data/financial-analyzer.db";
  db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");
  // Enable foreign key constraints
  db.pragma("foreign_keys = ON");

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS category_rules (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      pattern TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS statements (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      file_type TEXT,
      storage_path TEXT,
      upload_date TEXT NOT NULL DEFAULT (datetime('now')),
      period_start TEXT,
      period_end TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      statement_id TEXT,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
      category_id TEXT,
      raw_text TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (statement_id) REFERENCES statements(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_statement ON transactions(statement_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_category_rules_pattern ON category_rules(pattern);
  `);

  // Seed default categories if empty
  const count = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
  if (count.count === 0) {
    const defaultCategories = [
      { name: "Food & Dining", color: "#ef4444" },
      { name: "Transportation", color: "#f97316" },
      { name: "Shopping", color: "#f59e0b" },
      { name: "Entertainment", color: "#eab308" },
      { name: "Bills & Utilities", color: "#84cc16" },
      { name: "Healthcare", color: "#22c55e" },
      { name: "Travel", color: "#10b981" },
      { name: "Income", color: "#14b8a6" },
      { name: "Transfer", color: "#6366f1" },
      { name: "Uncategorized", color: "#64748b" },
    ];

    const insert = db.prepare(
      "INSERT INTO categories (id, name, color) VALUES (?, ?, ?)"
    );

    for (const cat of defaultCategories) {
      insert.run(generateId(), cat.name, cat.color);
    }
  }

  return db;
}
