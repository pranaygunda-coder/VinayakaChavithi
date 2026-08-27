import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { org } from "@/lib/org";
import { amountToWords } from "@/lib/amountToWords";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const donationId = Number(id);
  if (!Number.isInteger(donationId)) {
    return new Response("Invalid receipt id", { status: 400 });
  }

  const donation = await prisma.donation.findUnique({ where: { id: donationId } });
  if (!donation) {
    return new Response("Receipt not found", { status: 404 });
  }

  const amount = Number(donation.amount);
  const dateStr = donation.createdAt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#ffffff",
          padding: 24,
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            border: "3px solid #1d3f8f",
            borderRadius: 8,
            padding: "28px 40px",
            color: "#17255c",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 0.5 }}>{org.name}</div>
            <div style={{ fontSize: 15, marginTop: 4 }}>{org.regNo}</div>
            <div style={{ fontSize: 14, marginTop: 2, color: "#334166" }}>{org.address}</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginTop: 14,
                textDecoration: "underline",
              }}
            >
              {org.receiptTitle}
            </div>
          </div>

          {/* No. / Date row */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontSize: 18 }}>
            <div style={{ display: "flex" }}>
              No.&nbsp;<span style={{ color: "#c0392b", fontWeight: 700 }}>{String(donation.id).padStart(3, "0")}</span>
            </div>
            <div style={{ display: "flex" }}>Date:&nbsp;{dateStr}</div>
          </div>

          {/* Body */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 22, fontSize: 18, gap: 14 }}>
            <div style={{ display: "flex" }}>
              Received with thanks from Mr/Mrs/Kum.&nbsp;
              <span style={{ fontWeight: 700 }}>{donation.donorName}</span>
            </div>
            <div style={{ display: "flex" }}>
              Plot No./H.No.&nbsp;<span style={{ fontWeight: 700 }}>{donation.plotNo || "-"}</span>
            </div>
            <div style={{ display: "flex" }}>
              By Cash/UPI:&nbsp;<span style={{ fontWeight: 700 }}>{donation.mode}</span>
              &nbsp;&nbsp;{org.purposeText}
            </div>
            <div style={{ display: "flex" }}>
              Amount in words:&nbsp;<span style={{ fontWeight: 700 }}>{amountToWords(amount)}</span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "auto",
              paddingTop: 24,
              fontSize: 22,
            }}
          >
            <div style={{ display: "flex", fontWeight: 700 }}>
              Rs.&nbsp;{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: 14 }}>
              <div style={{ height: 40 }} />
              <div>Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 900, height: 520 },
  );
}
