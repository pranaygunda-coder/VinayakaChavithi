export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 flex flex-col items-center gap-4">
      <img
        src={`/api/receipts/${id}`}
        alt={`Donation receipt #${id}`}
        className="w-full rounded-lg border border-slate-200 shadow-sm"
      />
      <a
        href={`/api/receipts/${id}`}
        download={`receipt-${id}.png`}
        className="bg-indigo-600 text-white rounded px-4 py-2 text-sm font-medium"
      >
        Download receipt
      </a>
    </main>
  );
}
