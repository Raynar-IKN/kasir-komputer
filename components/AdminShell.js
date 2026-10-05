'use client';
import { createContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export const AdminNameContext = createContext('Admin');

const menu = [
  { href: '/admin', label: 'Ringkasan', icon: 'overview' },
  { href: '/admin/barang', label: 'Data Barang', icon: 'box' },
  { href: '/admin/stok', label: 'Update Stok', icon: 'stock' },
  { href: '/admin/laporan-stok', label: 'Laporan Stok', icon: 'history' },
  { href: '/admin/member', label: 'Member', icon: 'users' },
  { href: '/admin/kasir', label: 'Data Kasir', icon: 'user' },
  { href: '/admin/transaksi', label: 'Riwayat Transaksi', icon: 'receipt' },
  { href: '/admin/laporan', label: 'Laporan Penjualan', icon: 'chart' },
];

const icons = {
  overview: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="5" rx="1" /><rect x="13" y="10" width="8" height="11" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /></>,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4 7.5-4M12 12v9" /></>,
  stock: <><path d="M4 7h16M4 12h10M4 17h7" /><path d="m17 14 3 3-3 3" /></>,
  history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
  chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 5-7" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
};

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function Brand({ compact = false }) {
  return (
    <Link href="/admin" className="flex min-w-0 items-center gap-3" aria-label="Komputer Jaya, Ringkasan">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-linear-to-br from-primary to-accent text-white">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      </span>
      <span className={compact ? 'truncate text-sm font-bold' : 'truncate text-base font-bold'}>Komputer Jaya</span>
    </Link>
  );
}

function MenuLinks({ pathname, onNavigate }) {
  return (
    <nav aria-label="Navigasi admin" className="space-y-1">
      {menu.map((item) => {
        const active = item.href === '/admin'
          ? pathname === '/admin'
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
              active
                ? 'bg-primary-soft text-primary'
                : 'text-muted hover:bg-page hover:text-ink'
            }`}
          >
            <Icon name={item.icon} className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserInfo({ nama }) {
  const inisial = (nama || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-soft font-bold text-primary">{inisial}</span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold">{nama || 'Admin'}</p>
        <p className="mt-1 text-sm text-muted">Administrator</p>
      </div>
    </div>
  );
}

function LogoutButton({ onClick }) {
  return (
    <button onClick={onClick} className="btn btn-ghost min-w-10 border-primary/40 text-primary hover:bg-primary-soft">
      <Icon name="logout" />
      <span>Logout</span>
    </button>
  );
}

export default function AdminShell({ nama, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openPath, setOpenPath] = useState(null);
  const drawerOpen = openPath === pathname;

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpenPath(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [drawerOpen]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-page">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
        <Brand />
        <div className="mt-8 flex-1 overflow-y-auto"><MenuLinks pathname={pathname} /></div>
        <div className="mt-5 space-y-4 border-t border-line pt-5">
          <UserInfo nama={nama} />
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <LogoutButton onClick={logout} />
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:ml-72">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-line bg-surface/95 px-3 backdrop-blur sm:px-5 lg:hidden">
          <Brand compact />
          <button
            type="button"
            className="btn-icon"
            aria-label="Buka navigasi"
            aria-expanded={drawerOpen}
            onClick={() => setOpenPath(drawerOpen ? null : pathname)}
          >
            <Icon name={drawerOpen ? 'close' : 'menu'} />
          </button>
        </header>

        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 h-full w-full bg-ink/55"
              aria-label="Tutup navigasi"
              onClick={() => setOpenPath(null)}
            />
            <aside className="absolute inset-y-0 left-0 z-10 flex w-72 max-w-[calc(100vw-3rem)] flex-col border-r border-line bg-surface px-4 py-5 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <Brand />
                <button type="button" className="btn-icon" aria-label="Tutup navigasi" onClick={() => setOpenPath(null)}>
                  <Icon name="close" />
                </button>
              </div>
              <div className="mt-8 flex-1 overflow-y-auto">
                <MenuLinks pathname={pathname} onNavigate={() => setOpenPath(null)} />
              </div>
              <div className="mt-5 space-y-4 border-t border-line pt-5">
                <UserInfo nama={nama} />
                <div className="flex items-center justify-between">
                  <ThemeToggle />
                  <LogoutButton onClick={logout} />
                </div>
              </div>
            </aside>
          </div>
        )}

        <main className="mx-auto min-w-0 max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
          <AdminNameContext.Provider value={nama || 'Admin'}>{children}</AdminNameContext.Provider>
        </main>
      </div>
    </div>
  );
}