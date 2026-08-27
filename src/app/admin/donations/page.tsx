"use client";

import { useState } from "react";
import useSWR from "swr";

type Donation = {
  id: number;
  donorName: string;
  plotNo: string | null;
  amount: string;
  mode: "CASH" | "UPI";
  createdAt: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DonationsPage() {
  const { data, mutate } = useSWR<{ donations: Donation[] }>("/api/admin/donations", fetcher);
  const [donorName, setDonorName] = useState("");
  const [plotNo, setPlotNo] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"CASH" | "UPI">("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReceiptId, setLastReceiptId] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donorName, plotNo, amount: Number(amount), mode }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Failed to save donation");
      return;
    }
    const { donation } = await res.json();
    setLastReceiptId(donation.id);
    setDonorName("");
    setPlotNo("");
    setAmount("");
    setMode("CASH");
    mutate();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold text-slate-800">Add Donation</h1>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 bg-white border border-slate-200 rounded-lg p-4">
        <input
          required
          placeholder="Donor name"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2"
        />
        <input
          placeholder="Plot No. / H.No. (optional)"
          value={plotNo}
          onChange={(e) => setPlotNo(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2"
        />
        <input
          required
          type="number"
          min="1"
          step="1"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2"
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "CASH" | "UPI")}
          className="border border-slate-300 rounded px-3 py-2"
        >
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
        </select>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-emerald-600 text-white rounded py-2 font-medium disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save Donation"}
        </button>
      </form>

      {lastReceiptId !== null && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
          Donation saved. Receipt #{lastReceiptId} —{" "}
          <a
            className="text-indigo-600 font-medium underline"
            href={`/receipt/${lastReceiptId}`}
            target="_blank"
            rel="noreferrer"
          >
            view / share receipt
          </a>
        </div>
      )}

      <h2 className="text-lg font-semibold text-slate-700 mt-8 mb-3">Recent Donations</h2>
      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 overflow-hidden bg-white">
        {data?.donations.map((d) => (
          <div key={d.id} className="flex justify-between items-center p-3 text-sm">
            <div>
              <div className="font-medium text-slate-800">
                #{d.id} {d.donorName}
              </div>
              <div className="text-slate-400">{d.plotNo ? `Plot ${d.plotNo} · ` : ""}{d.mode}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-emerald-600">₹{Number(d.amount).toLocaleString("en-IN")}</span>
              <a className="text-xs text-indigo-600 underline" href={`/receipt/${d.id}`} target="_blank" rel="noreferrer">
                receipt
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
