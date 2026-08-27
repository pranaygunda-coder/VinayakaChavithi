"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return <>{children}</>;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div>
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/admin" className="text-slate-700 hover:text-indigo-600">Overview</Link>
            <Link href="/admin/donations" className="text-slate-700 hover:text-indigo-600">Donations</Link>
            <Link href="/admin/expenses" className="text-slate-700 hover:text-indigo-600">Expenses</Link>
          </div>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-red-500">
            Log out
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
