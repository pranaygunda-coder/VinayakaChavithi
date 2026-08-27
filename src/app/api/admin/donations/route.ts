import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const createDonationSchema = z.object({
  donorName: z.string().trim().min(1).max(120),
  plotNo: z.string().trim().max(40).optional().or(z.literal("")),
  amount: z.number().positive().max(10_000_000),
  mode: z.enum(["CASH", "UPI"]),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

// GET: latest donations (admin view). POST: create a donation (atomic, safe for concurrent admins).
export async function GET() {
  const donations = await prisma.donation.findMany({
    orderBy: { id: "desc" },
    take: 100,
  });
  return NextResponse.json({ donations });
}

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createDonationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { donorName, plotNo, amount, mode, note } = parsed.data;
  const donation = await prisma.donation.create({
    data: {
      donorName,
      plotNo: plotNo || null,
      amount,
      mode,
      note: note || null,
      createdBy: session.email,
    },
  });

  return NextResponse.json({ donation }, { status: 201 });
}
