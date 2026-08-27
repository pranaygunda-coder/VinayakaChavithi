"use client";

import { useState } from "react";
import useSWR from "swr";
import { compressImage } from "@/lib/compressImage";

type Expense = {
  id: number;
  title: string;
  category: string | null;
  amount: string;
  billUrl: string | null;
  createdAt: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ExpensesPage() {
  const { data, mutate } = useSWR<{ expenses: Expense[] }>("/api/admin/expenses", fetcher);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let billUrl = "";
      if (file) {
        const compressed = await compressImage(file);
        const form = new FormData();
        form.append("file", compressed);
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: form });
        if (!uploadRes.ok) throw new Error("Bill upload failed");
        billUrl = (await uploadRes.json()).url;
      }

      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, vendor, amount: Number(amount), billUrl }),
      });
      if (!res.ok) throw new Error("Failed to save expense");

      setTitle("");
      setCategory("");
      setVendor("");
      setAmount("");
      setFile(null);
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold text-slate-800">Add Expense</h1>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 bg-white border border-slate-200 rounded-lg p-4">
        <input
          required
          placeholder="What was this for?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2"
        />
        <input
          placeholder="Category (optional, e.g. Decoration)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2"
        />
        <input
          placeholder="Vendor (optional)"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
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
        <label className="text-sm text-slate-500">
          Bill photo (optional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block mt-1"
          />
        </label>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-rose-600 text-white rounded py-2 font-medium disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save Expense"}
        </button>
      </form>

      <h2 className="text-lg font-semibold text-slate-700 mt-8 mb-3">Recent Expenses</h2>
      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 overflow-hidden bg-white">
        {data?.expenses.map((e) => (
          <div key={e.id} className="flex justify-between items-center p-3 text-sm">
            <div>
              <div className="font-medium text-slate-800">
                #{e.id} {e.title}
              </div>
              <div className="text-slate-400">{e.category ?? "General"}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-rose-600">₹{Number(e.amount).toLocaleString("en-IN")}</span>
              {e.billUrl && (
                <a className="text-xs text-indigo-600 underline" href={e.billUrl} target="_blank" rel="noreferrer">
                  bill
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
