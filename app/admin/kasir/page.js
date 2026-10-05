'use client';
import { useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/AdminStates';

export default function KasirAdminPage() {
  const [cashiers, setCashiers] = useState([]);
  const [form, setForm] = useState({ nama: '', username: '', password: '' });
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/users')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memuat daftar kasir.');
        return result;
      })
      .then((result) => {
        if (!active) return;
        setCashiers(result);
        setError('');
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || 'Gagal memuat daftar kasir.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [retry]);

  function reload() {
    setLoading(true);
    setRetry((value) => value + 1);
  }

  async function createCashier(event) {
    event.preventDefault();
    setFormError('');
    if (!form.nama.trim() || !form.username.trim() || form.password.length < 6) {
      setFormError('Nama dan username wajib diisi. Password minimal 6 karakter.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal mendaftarkan kasir.');
      setForm({ nama: '', username: '', password: '' });
      reload();
    } catch (requestError) {
      setFormError(requestError.message || 'Gagal mendaftarkan kasir.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold">Data Kasir</h1><p className="mt-1 text-sm text-muted">Daftarkan akun kasir yang dapat masuk ke aplikasi.</p></header>

      <form onSubmit={createCashier} className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">Daftarkan Kasir</h2>
        <label className="label" htmlFor="cashier-name">Nama
          <input id="cashier-name" className="input mt-1.5" value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} maxLength={100} required />
        </label>
        <label className="label" htmlFor="cashier-username">Username
          <input id="cashier-username" className="input mt-1.5" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} minLength={3} maxLength={30} autoComplete="off" required />
        </label>
        <label className="label sm:col-span-2" htmlFor="cashier-password">Password
          <span className="mt-1.5 flex gap-2">
            <input id="cashier-password" className="input min-w-0 flex-1" type={visiblePassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={6} maxLength={72} autoComplete="new-password" required />
            <button type="button" className="btn btn-ghost shrink-0" onClick={() => setVisiblePassword((value) => !value)} aria-pressed={visiblePassword}>{visiblePassword ? 'Sembunyikan' : 'Tampilkan'}</button>
          </span>
          <span className="mt-1 block text-sm font-normal text-muted">Minimal 6 karakter.</span>
        </label>
        {formError && <div className="sm:col-span-2"><ErrorState message={formError} /></div>}
        <div className="sm:col-span-2"><button className="btn btn-primary" disabled={saving}>{saving ? 'Mendaftarkan...' : 'Daftarkan Kasir'}</button></div>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Daftar Kasir</h2>
        {error && <ErrorState message={error} onRetry={reload} />}
        {loading ? <LoadingState label="Memuat daftar kasir..." /> : !error && cashiers.length === 0 ? (
          <EmptyState>Belum ada akun kasir.</EmptyState>
        ) : !error && (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block"><div className="overflow-x-auto"><table className="tbl min-w-[600px]">
              <thead><tr><th>Nama</th><th>Username</th><th>Tanggal Dibuat</th></tr></thead>
              <tbody>{cashiers.map((cashier) => <tr key={cashier.id}><td className="font-medium">{cashier.nama}</td><td className="font-mono">{cashier.username}</td><td>{cashier.created_at}</td></tr>)}</tbody>
            </table></div></div>
            <div className="grid gap-3 md:hidden">{cashiers.map((cashier) => (
              <article className="card space-y-2 p-4" key={cashier.id}><p className="font-semibold">{cashier.nama}</p><p className="font-mono text-sm">{cashier.username}</p><p className="text-sm text-muted">Dibuat {cashier.created_at}</p></article>
            ))}</div>
          </>
        )}
      </section>
    </div>
  );
}