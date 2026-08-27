import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, read-only. Totals are always computed live via SQL SUM/COUNT aggregates
// (never a stored running counter), so concurrent donation/expense inserts can
// never cause a lost update or stale total.
export async function GET() {
  const [donationAgg, expenseAgg, recentDonations, recentExpenses] = await Promise.all([
    prisma.donation.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.expense.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.donation.findMany({ orderBy: { id: "desc" }, take: 10 }),
    prisma.expense.findMany({ orderBy: { id: "desc" }, take: 10 }),
  ]);

  const totalDonations = Number(donationAgg._sum.amount ?? 0);
  const totalExpenses = Number(expenseAgg._sum.amount ?? 0);

  return NextResponse.json(
    {
      totalDonations,
      totalExpenses,
      balance: totalDonations - totalExpenses,
      donationCount: donationAgg._count,
      expenseCount: expenseAgg._count,
      recentDonations,
      recentExpenses,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
