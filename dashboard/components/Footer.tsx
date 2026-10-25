import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-300">Narrative Launcher</span>
          <span>·</span>
          <span>Skeletal preview (Phase 1 mock data)</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/docs" className="hover:text-slate-200 underline-offset-4 hover:underline transition">
            Documentation
          </Link>
          <a
            href="OPERATOR_TO_SUPPLY_GITHUB_URL"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-200 underline-offset-4 hover:underline transition"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
