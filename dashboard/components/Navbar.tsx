'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Activity, CheckSquare, History, Settings, FileText, LogOut, Menu, X, ShieldAlert } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Status', icon: Activity },
  { href: '/approvals', label: 'Approvals', icon: CheckSquare, badge: '1' },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/docs', label: 'Docs', icon: FileText },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Do not render full navigation bar on /login
  if (pathname === '/login') {
    return (
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-slate-200 text-sm">
              NL
            </div>
            <span className="font-semibold text-slate-200">Narrative Launcher</span>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
            Phase 1 Skeletal
          </span>
        </div>
      </header>
    );
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      router.push('/login');
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-slate-200 text-sm group-hover:border-slate-500 transition">
                NL
              </div>
              <span className="font-semibold text-slate-200 group-hover:text-white transition">
                Narrative Launcher
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DRY RUN
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Logout & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Logout"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded border border-slate-800 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 pt-2 pb-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded text-sm font-medium ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
