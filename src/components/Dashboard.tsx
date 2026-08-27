"use client";

import useSWR from "swr";

type DashboardData = {
  totalDonations: number;
  totalExpenses: number;
  balance: number;
  donationCount: number;
  expenseCount: number;
  recentDonations: {
    id: number;
    donorName: string;
    plotNo: string | null;
    amount: string;
    mode: "CASH" | "UPI";
    createdAt: string;
  }[];
  recentExpenses: {
    id: number;
    title: string;
    category: string | null;
    amount: string;
    billUrl: string | null;
    createdAt: string;
  }[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatINR(amount: number) {
  return amount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export default function Dashboard({ orgName }: { orgName: string }) {
  const { data, error, isLoading } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    refreshInterval: 5000,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-center text-slate-800">{orgName}</h1>
      <p className="text-center text-slate-500 mt-1">Vinayaka Chavithi — Live Fund Tracker</p>

      {isLoading && <p className="text-center mt-8 text-slate-400">Loading…</p>}
      {error && <p className="text-center mt-8 text-red-500">Failed to load dashboard.</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <StatCard label="Total Donations" value={formatINR(data.totalDonations)} sub={`${data.donationCount} donations`} color="text-emerald-600" />
            <StatCard label="Total Spent" value={formatINR(data.totalExpenses)} sub={`${data.expenseCount} expenses`} color="text-rose-600" />
            <StatCard label="Balance in Hand" value={formatINR(data.balance)} color="text-indigo-600" />
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Recent Donations</h2>
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 overflow-hidden">
              {data.recentDonations.length === 0 && <p className="p-4 text-slate-400 text-sm">No donations yet.</p>}
              {data.recentDonations.map((d) => (
                <div key={d.id} className="flex justify-between items-center p-3 text-sm bg-white">
                  <div>
                    <div className="font-medium text-slate-800">{d.donorName}</div>
                    <div className="text-slate-400">{d.plotNo ? `Plot ${d.plotNo} · ` : ""}{d.mode}</div>
                  </div>
                  <div className="font-semibold text-emerald-600">{formatINR(Number(d.amount))}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Recent Expenses</h2>
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 overflow-hidden">
              {data.recentExpenses.length === 0 && <p className="p-4 text-slate-400 text-sm">No expenses yet.</p>}
              {data.recentExpenses.map((e) => (
                <div key={e.id} className="flex justify-between items-center p-3 text-sm bg-white">
                  <div>
                    <div className="font-medium text-slate-800">{e.title}</div>
                    <div className="text-slate-400">{e.category ?? "General"}</div>
                  </div>
                  <div className="font-semibold text-rose-600">{formatINR(Number(e.amount))}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <p className="text-center text-xs text-slate-300 mt-10">
        <a href="/admin/login">Admin login</a>
      </p>
    </main>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 bg-white text-center">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
