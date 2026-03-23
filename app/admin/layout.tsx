// Admin routes are protected by middleware.ts (secret token check).
// This layout handles UI only.

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-300 bg-stone-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-white">Diagnosis — Admin</span>
            <span className="rounded bg-stone-700 px-2 py-0.5 text-[10px] font-medium text-stone-300 uppercase tracking-wide">
              Internal
            </span>
          </div>
          <nav className="flex gap-4 text-xs text-stone-400">
            <a href="/admin" className="hover:text-white transition-colors">
              Submissions
            </a>
            <a href="/admin/reports" className="hover:text-white transition-colors">
              Reports
            </a>
            <a href="/" className="hover:text-white transition-colors">
              ← Homepage
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
