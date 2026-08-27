import Link from "next/link";
import Dashboard from "@/components/Dashboard";
import { org } from "@/lib/org";

export default function AdminOverviewPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-6 flex gap-3">
        <Link href="/admin/donations" className="bg-emerald-600 text-white text-sm font-medium rounded px-4 py-2">
          + Add Donation
        </Link>
        <Link href="/admin/expenses" className="bg-rose-600 text-white text-sm font-medium rounded px-4 py-2">
          + Add Expense
        </Link>
      </div>
      <Dashboard orgName={org.name} />
    </div>
  );
}
