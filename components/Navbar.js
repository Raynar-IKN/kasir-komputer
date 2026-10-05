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
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-6">
          <Link href={links[0].href} className="flex shrink-0 items-center gap-2.5" aria-label="Komputer Jaya">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-linear-to-br from-primary to-accent text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </span>
            <span className="hidden truncate font-bold sm:inline">Komputer Jaya</span>
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap sm:flex-none" aria-label="Navigasi kasir">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-10 items-center rounded-md px-2.5 py-2 text-sm font-medium transition sm:px-3 ${
                    active ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-page hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <div className="hidden max-w-48 items-center gap-2 rounded-md border border-line py-1 pl-1 pr-2 sm:flex">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-primary-soft text-sm font-bold text-primary">
              {inisial}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{nama}</p>
              <p className="text-sm capitalize text-muted">{role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost min-w-10 border-primary/40 px-2 text-primary hover:bg-primary-soft sm:px-3"
            aria-label="Logout"
            title="Logout"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}