import ThemeToggle from './ThemeToggle';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel kiri (branding) */}
      <div className="relative hidden overflow-hidden bg-linear-to-br from-primary via-primary to-accent p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-linear-to-br from-primary-hover to-accent-hover text-white">
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
          <p className="max-w-md text-white/90">
            Catat transaksi, pantau stok, cetak struk PDF, dan lihat laporan penjualan dalam satu aplikasi.
          </p>
        </div>

        <p className="relative text-sm text-white/80">© {new Date().getFullYear()} Toko Komputer Jaya</p>
      </div>

      {/* Panel kanan (form) */}
      <div className="relative flex items-center justify-center p-6">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>
          <div className="card p-6">{children}</div>
          {footer && <p className="mt-5 text-center text-sm text-muted">{footer}</p>}
        </div>
      </div>
    </div>
  );
}