'use client';

import { useContext, useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AdminNameContext } from '@/components/AdminShell';
import { EmptyState, ErrorState } from '@/components/AdminStates';
import { rp } from '@/lib/utils';

const chartColors = ['var(--primary)', 'var(--accent)', 'var(--muted)'];
const methodNames = {
  tunai: 'Tunai',
  debit: 'Debit',
  qris: 'QRIS',
  transfer: 'Transfer Bank',
};
const subscribeToNothing = () => () => {};
const isClientSnapshot = () => true;
const isServerSnapshot = () => false;

function Icon({ name, className = 'h-5 w-5' }) {
  const paths = {
    income: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
    profit: <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    transactions: <><path d="M8 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" /><path d="M16 2h5v5M21 2l-9 9" /><path d="M7 14h4M7 17h3" /></>,
    items: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4 7.5-4M12 12v9" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3" /></>,
    up: <><path d="m6 14 6-6 6 6" /></>,
    down: <><path d="m6 10 6 6 6-6" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4 7.5-4M12 12v9" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    cashiers: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    alert: <><path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-page ${className}`} aria-hidden="true" />;
}

function Panel({ title, icon, action, children, className = '' }) {
  return (
    <section className={`card min-w-0 p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 font-semibold">
          {icon && <Icon name={icon} className="h-5 w-5 shrink-0 text-primary" />}
          <span className="truncate">{title}</span>
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ChangeBadge({ current, previous }) {
  if (previous === 0) return <span className="badge badge-muted">Baru</span>;
  const difference = current - previous;
  if (difference === 0) return <span className="badge badge-muted">0%</span>;
  const percentage = Math.round((difference / previous) * 100);
  const rising = difference > 0;

  return (
    <span className={`badge gap-1 ${rising ? 'badge-accent' : 'badge-muted'}`}>
      <Icon name={rising ? 'up' : 'down'} className="h-3.5 w-3.5" />
      {rising ? '+' : ''}{percentage}%
    </span>
  );
}

function StatCard({ title, value, icon, current, previous, loading }) {
  return (
    <article className="stat-card min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted">{title}</p>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
          <Icon name={icon} />
        </span>
      </div>
      {loading ? <Skeleton className="mt-4 h-8 w-3/5" /> : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="min-w-0 break-words text-xl font-bold sm:text-2xl">{value}</p>
          <ChangeBadge current={current} previous={previous} />
        </div>
      )}
      {!loading && <p className="mt-2 text-xs text-muted">dibanding kemarin</p>}
    </article>
  );
}

function formatDateTime(value) {
  if (!value) return '—';
  const timestamp = String(value).includes('T')
    ? String(value)
    : `${String(value).replace(' ', 'T')}+07:00`;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

export default function AdminPage() {
  const adminName = useContext(AdminNameContext);
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const mounted = useSyncExternalStore(subscribeToNothing, isClientSnapshot, isServerSnapshot);
  const now = mounted ? new Date() : null;

  useEffect(() => {
    let active = true;
    fetch('/api/dashboard')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memuat dashboard.');
        return result;
      })
      .then((result) => {
        if (!active) return;
        setData(result);
        setError('');
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || 'Gagal memuat dashboard.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [retry]);

  const hour = now
    ? Number(new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(now))
    : undefined;
  const greeting = hour === undefined
    ? 'Selamat datang'
    : hour < 11
      ? 'Selamat pagi'
      : hour < 15
        ? 'Selamat siang'
        : hour < 19
          ? 'Selamat sore'
          : 'Selamat malam';
  const todayLabel = now
    ? new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(now)
    : '';

  const stats = [
    { title: 'Pendapatan Hari Ini', key: 'pendapatan', icon: 'income', format: rp },
    { title: 'Laba Hari Ini', key: 'laba', icon: 'profit', format: rp },
    { title: 'Transaksi Hari Ini', key: 'transaksi', icon: 'transactions', format: (value) => Number(value).toLocaleString('id-ID') },
    { title: 'Barang Terjual Hari Ini', key: 'barangTerjual', icon: 'items', format: (value) => Number(value).toLocaleString('id-ID') },
  ];
  const chartHasData = data?.tujuhHari?.some((item) => item.transaksi > 0);
  const totalMethodTransactions = data?.metodeBulanIni?.reduce((sum, item) => sum + item.transaksi, 0) || 0;
  const maxBestSellerQty = Math.max(0, ...(data?.terlaris || []).map((item) => item.qty));
  const stockSummary = data?.stokRingkas;
  const miniCards = [
    { label: 'Jenis Barang', value: stockSummary?.jenis, icon: 'box' },
    { label: 'Total Stok', value: stockSummary?.totalStok, icon: 'items' },
    { label: 'Nilai Stok', value: stockSummary ? rp(stockSummary.nilaiStok) : '', icon: 'income' },
    { label: 'Member', value: data?.jumlahMember, icon: 'users' },
    { label: 'Kasir', value: data?.jumlahKasir, icon: 'cashiers' },
  ];

  function refresh() {
    setLoading(true);
    setError('');
    setRetry((value) => value + 1);
  }

  function openTransaction(event, id) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      router.push(`/admin/transaksi/${id}`);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {adminName || 'Admin'}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted">
            <Icon name="calendar" className="h-4 w-4" />
            {todayLabel || <Skeleton className="h-4 w-44" />}
          </div>
        </div>
        <button type="button" onClick={refresh} disabled={loading} className="btn btn-ghost">
          <Icon name="refresh" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error && <ErrorState message={error} onRetry={refresh} />}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistik hari ini">
        {stats.map(({ key, ...stat }) => (
          <StatCard
            key={key}
            {...stat}
            loading={loading}
            value={data ? stat.format(data.hariIni[key]) : ''}
            current={data?.hariIni?.[key] || 0}
            previous={data?.kemarin?.[key] || 0}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Penjualan 7 Hari Terakhir" icon="income" className="xl:col-span-2">
          {loading ? <Skeleton className="h-[280px] w-full" /> : !data?.tujuhHari?.length ? (
            <EmptyState>Belum ada data penjualan.</EmptyState>
          ) : !chartHasData ? (
            <EmptyState>Belum ada transaksi dalam 7 hari terakhir.</EmptyState>
          ) : mounted ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.tujuhHari} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--line)' }} />
                  <YAxis
                    width={58}
                    tick={{ fill: 'var(--muted)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(0)} jt` : value >= 1000 ? `${(value / 1000).toFixed(0)} rb` : value}
                  />
                  <Tooltip
                    formatter={(value) => [rp(Number(value)), 'Pendapatan']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.tanggal || ''}
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--muted)' }}
                  />
                  <Area type="monotone" dataKey="pendapatan" stroke="var(--primary)" strokeWidth={2.5} fill="url(#salesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <Skeleton className="h-[280px] w-full" />}
        </Panel>

        <Panel title="Bulan Ini" icon="calendar">
          {loading ? (
            <div className="space-y-5">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-12 w-full" />)}</div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Pendapatan', value: data?.bulanIni?.pendapatan, tone: 'text-primary' },
                { label: 'Laba', value: data?.bulanIni?.laba, tone: 'text-accent' },
                { label: 'Transaksi', value: data?.bulanIni?.transaksi, tone: 'text-muted' },
              ].map((item) => (
                <div className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0" key={item.label}>
                  <span className="text-sm text-muted">{item.label}</span>
                  <span className={`text-right font-semibold ${item.tone}`}>
                    {item.value === undefined ? '—' : item.label === 'Transaksi' ? Number(item.value).toLocaleString('id-ID') : rp(item.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Metode Pembayaran" icon="transactions">
          {loading ? <Skeleton className="h-[230px] w-full" /> : !data?.metodeBulanIni?.length ? (
            <EmptyState>Belum ada transaksi bulan ini.</EmptyState>
          ) : (
            <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="h-[210px] min-w-0">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.metodeBulanIni} dataKey="total" nameKey="metode" innerRadius="58%" outerRadius="82%" paddingAngle={3} stroke="none">
                        {data.metodeBulanIni.map((item, index) => <Cell key={item.metode} fill={chartColors[index % chartColors.length]} />)}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [rp(Number(value)), 'Total']}
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)', borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <ul className="space-y-3">
                {data.metodeBulanIni.map((item, index) => {
                  const percentage = totalMethodTransactions ? Math.round((item.transaksi / totalMethodTransactions) * 100) : 0;
                  return (
                    <li className="flex items-center justify-between gap-3 text-sm" key={item.metode}>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                        <span className="truncate">{methodNames[item.metode] || item.metode}</span>
                      </span>
                      <span className="shrink-0 text-muted">{percentage}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="Produk Terlaris" icon="box">
          {loading ? <div className="space-y-5">{[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-8 w-full" />)}</div> : !data?.terlaris?.length ? (
            <EmptyState>Belum ada produk terjual bulan ini.</EmptyState>
          ) : (
            <ol className="space-y-4">
              {data.terlaris.map((product, index) => (
                <li key={`${product.nama}-${index}`}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{product.nama}</span>
                    <span className="shrink-0 text-muted">{product.qty.toLocaleString('id-ID')} terjual</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-page">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${maxBestSellerQty ? Math.max(6, (product.qty / maxBestSellerQty) * 100) : 0}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Peringatan Stok"
          icon="alert"
          action={<Link href="/admin/stok" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Kelola stok <Icon name="arrow" className="h-4 w-4" /></Link>}
        >
          {loading ? <div className="space-y-3">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-12 w-full" />)}</div> : !data?.stokMenipis?.length ? (
            <EmptyState>Semua stok aman</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {data.stokMenipis.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{product.nama}</p>
                    <p className="mt-0.5 text-xs text-muted">{product.kode}</p>
                  </div>
                  <span className={`badge shrink-0 ${product.stok === 0 ? 'badge-muted' : 'badge-primary'}`}>
                    {product.stok === 0 ? 'Habis' : `Sisa ${product.stok}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Transaksi Terbaru" icon="transactions" action={<Link href="/admin/transaksi" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Semua <Icon name="arrow" className="h-4 w-4" /></Link>}>
          {loading ? <div className="space-y-3">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-12 w-full" />)}</div> : !data?.transaksiTerbaru?.length ? (
            <EmptyState>Belum ada transaksi.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {data.transaksiTerbaru.map((transaction) => (
                <li
                  key={transaction.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Buka transaksi ${transaction.kode_transaksi}`}
                  className="flex cursor-pointer items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 focus-visible:outline-2 focus-visible:outline-primary"
                  onClick={() => router.push(`/admin/transaksi/${transaction.id}`)}
                  onKeyDown={(event) => openTransaction(event, transaction.id)}
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-primary">{transaction.kode_transaksi}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">{formatDateTime(transaction.created_at)} · {transaction.kasir}</p>
                  </div>
                  <span className="shrink-0 text-right text-sm font-semibold">{rp(transaction.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="Ringkasan lainnya">
        {miniCards.map((card) => (
          <article className="stat-card min-w-0 p-3 sm:p-4" key={card.label}>
            <div className="flex items-center gap-2 text-muted">
              <Icon name={card.icon} className="h-4 w-4 shrink-0 text-primary" />
              <p className="truncate text-xs sm:text-sm">{card.label}</p>
            </div>
            {loading ? <Skeleton className="mt-3 h-6 w-3/4" /> : (
              <p className="mt-2 truncate text-lg font-bold sm:text-xl">
                {card.value === undefined ? '—' : typeof card.value === 'number' ? Number(card.value).toLocaleString('id-ID') : card.value}
              </p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
