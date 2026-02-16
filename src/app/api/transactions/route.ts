import { NextRequest, NextResponse } from "next/server";
import { getDb, generateId } from "@/lib/db";
import type { Transaction } from "@/lib/types/database.types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 5000;

    const db = getDb();
    const transactions = db
      .prepare(`SELECT * FROM transactions ORDER BY date DESC LIMIT ?`)
      .all(limit) as Transaction[];

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transactions = Array.isArray(body) ? body : [body];

    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO transactions (id, statement_id, date, description, amount, type, category_id, raw_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((txns: Array<{
      statement_id?: string | null;
      date: string;
      description: string;
      amount: number;
      type: string;
      category_id?: string | null;
      raw_text?: string | null;
    }>) => {
      for (const txn of txns) {
        insert.run(
          generateId(),
          txn.statement_id || null,
          txn.date,
          txn.description,
          txn.amount,
          txn.type,
          txn.category_id || null,
          txn.raw_text || null
        );
      }
    });

    insertMany(transactions);

    return NextResponse.json({ success: true, count: transactions.length });
  } catch (error) {
    console.error("Error creating transactions:", error);
    return NextResponse.json(
      { error: "Failed to create transactions" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = db.prepare("DELETE FROM transactions WHERE id = ?").run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
