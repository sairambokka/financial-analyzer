import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Claude API key not configured on server" },
      { status: 500 }
    );
  }

  try {
    const { text, categoryNames } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' field" },
        { status: 400 }
      );
    }

    const categoryList =
      categoryNames?.length
        ? `\n\nAvailable categories: ${categoryNames.join(", ")}`
        : "";

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Extract all financial transactions from this bank/credit card statement text. Return ONLY a JSON array where each element has:
- "date": string in YYYY-MM-DD format
- "description": string describing the transaction
- "amount": positive number (no currency symbols)
- "type": either "credit" or "debit"
- "category": string — the best matching category from the list below

If a transaction is a payment, deposit, or refund, mark it as "credit". If it's a purchase, fee, or charge, mark it as "debit".

IMPORTANT — Credit card payments, balance transfers, inter-account transfers, and payments between accounts are NOT real income or expenses. They are just money moving between accounts. Categorize these as "Transfer". Examples:
- "PAYMENT RECEIVED" or "PAYMENT - THANK YOU" on a credit card statement
- "CREDIT CARD PAYMENT" or "ONLINE PAYMENT" on a bank statement
- ACH transfers, wire transfers between own accounts, Zelle/Venmo transfers to self

For "category", you MUST pick exactly one of these categories for each transaction. Use the category name exactly as written:${categoryList}

If none fit well, use "Other".

Statement text:
${text}

Return ONLY the JSON array, no other text.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response from Claude API" },
        { status: 500 }
      );
    }

    // Extract JSON from response (handle possible markdown code blocks)
    let jsonStr = content.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    return NextResponse.json({ transactions: parsed });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to process with AI";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
