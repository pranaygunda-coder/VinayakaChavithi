import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

async function resetDb() {
  await prisma.donation.deleteMany();
  await prisma.expense.deleteMany();
}

describe("concurrent donation/expense writes", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it("keeps every donation and its receipt number unique under heavy parallel writes", async () => {
    const CONCURRENT_WRITES = 100;

    const results = await Promise.all(
      Array.from({ length: CONCURRENT_WRITES }, (_, i) =>
        prisma.donation.create({
          data: {
            donorName: `Donor ${i}`,
            amount: 100 + i,
            mode: i % 2 === 0 ? "CASH" : "UPI",
            createdBy: "admin@test.local",
          },
        }),
      ),
    );

    // Every autoincrement id (used as the receipt number) must be unique.
    const ids = results.map((r) => r.id);
    expect(new Set(ids).size).toBe(CONCURRENT_WRITES);

    const count = await prisma.donation.count();
    expect(count).toBe(CONCURRENT_WRITES);
  });

  it("computes a dashboard total that always equals the exact sum of concurrently-inserted donations", async () => {
    const CONCURRENT_WRITES = 150;
    const amounts = Array.from({ length: CONCURRENT_WRITES }, (_, i) => 50 + (i % 37));
    const expectedTotal = amounts.reduce((a, b) => a + b, 0);

    await Promise.all(
      amounts.map((amount, i) =>
        prisma.donation.create({
          data: {
            donorName: `Donor ${i}`,
            amount,
            mode: "CASH",
            createdBy: "admin@test.local",
          },
        }),
      ),
    );

    // Dashboard total is a live SUM aggregate, never a stored counter — must match exactly.
    const agg = await prisma.donation.aggregate({ _sum: { amount: true }, _count: true });
    expect(agg._count).toBe(CONCURRENT_WRITES);
    expect(Number(agg._sum.amount)).toBe(expectedTotal);
  });

  it("keeps donation and expense totals correct when both are written concurrently by many admins", async () => {
    const WRITERS = 60;

    const donationWrites = Array.from({ length: WRITERS }, (_, i) =>
      prisma.donation.create({
        data: { donorName: `Donor ${i}`, amount: 200, mode: "UPI", createdBy: `admin${i % 5}@test.local` },
      }),
    );
    const expenseWrites = Array.from({ length: WRITERS }, (_, i) =>
      prisma.expense.create({
        data: { title: `Expense ${i}`, amount: 75, createdBy: `admin${i % 5}@test.local` },
      }),
    );

    // Interleave both kinds of writes in one Promise.all to simulate simultaneous admins.
    await Promise.all([...donationWrites, ...expenseWrites]);

    const [donationAgg, expenseAgg] = await Promise.all([
      prisma.donation.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ _sum: { amount: true }, _count: true }),
    ]);

    expect(donationAgg._count).toBe(WRITERS);
    expect(Number(donationAgg._sum.amount)).toBe(WRITERS * 200);
    expect(expenseAgg._count).toBe(WRITERS);
    expect(Number(expenseAgg._sum.amount)).toBe(WRITERS * 75);
  });

  it("never produces duplicate expense (bill) numbers under parallel uploads", async () => {
    const CONCURRENT_WRITES = 80;

    const results = await Promise.all(
      Array.from({ length: CONCURRENT_WRITES }, (_, i) =>
        prisma.expense.create({
          data: { title: `Bill ${i}`, amount: 10 + i, createdBy: "admin@test.local" },
        }),
      ),
    );

    const ids = results.map((r) => r.id);
    expect(new Set(ids).size).toBe(CONCURRENT_WRITES);
  });
});
