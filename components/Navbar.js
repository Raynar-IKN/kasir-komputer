'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ nama, role, links }) {
  const router = useRouter();
  const pathname = usePathname();
  const inisial = (nama || '?').trim().charAt(0).toUpperCase();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href={links[0].href} className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </span>
            <span className="hidden font-bold tracking-tight sm:block">Komputer Jaya</span>
          </Link>

          <nav className="flex items-center gap-1">
            {links.map((l) => {
              const aktif = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    aktif
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-2.5 rounded-xl border border-slate-200 py-1 pl-1 pr-3 dark:border-slate-700 sm:flex">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              {inisial}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-medium">{nama}</p>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{role}</p>
            </div>
          </div>
          <button onClick={logout} className="btn btn-danger">Logout</button>
        </div>
      </div>
    </header>
  );
}