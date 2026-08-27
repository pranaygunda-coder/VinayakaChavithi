import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const createExpenseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  vendor: z.string().trim().max(120).optional().or(z.literal("")),
  amount: z.number().positive().max(10_000_000),
  billUrl: z.string().url().optional().or(z.literal("")),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

// GET: latest expenses (admin view). POST: create an expense (atomic, safe for concurrent admins).
export async function GET() {
  const expenses = await prisma.expense.findMany({
    orderBy: { id: "desc" },
    take: 100,
  });
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createExpenseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, category, vendor, amount, billUrl, note } = parsed.data;
  const expense = await prisma.expense.create({
    data: {
      title,
      category: category || null,
      vendor: vendor || null,
      amount,
      billUrl: billUrl || null,
      note: note || null,
      createdBy: session.email,
    },
  });

  return NextResponse.json({ expense }, { status: 201 });
}
