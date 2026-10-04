import ThemeToggle from './ThemeToggle';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel kiri (branding) */}
      <div className="relative hidden overflow-hidden bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight">Komputer Jaya</span>
        </div>

        <div className="relative space-y-4">
          <h2 className="text-4xl font-bold leading-tight">
            Kelola penjualan toko komputer dengan lebih cepat.
          </h2>
          <p className="max-w-md text-indigo-100">
            Catat transaksi, pantau stok, cetak struk PDF, dan lihat laporan penjualan dalam satu aplikasi.
          </p>
        </div>

        <p className="relative text-sm text-indigo-200">© {new Date().getFullYear()} Toko Komputer Jaya</p>
      </div>

      {/* Panel kanan (form) */}
      <div className="relative flex items-center justify-center p-6">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          <div className="card p-6">{children}</div>
          <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</p>
        </div>
      </div>
    </div>
  );
}