'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nama: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    alert('Registrasi berhasil, silakan login');
    router.push('/login');
  }

  return (
    <AuthLayout
      title="Daftar Akun Kasir"
      subtitle="Buat akun untuk mulai mencatat transaksi."
      footer={<>Sudah punya akun? <Link href="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Login</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="alert-error">{error}</div>}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Nama lengkap</label>
          <input className="input" placeholder="Nama kamu" value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Username</label>
          <input className="input" placeholder="Username unik" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Password</label>
          <input type="password" className="input" placeholder="Minimal 6 karakter" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Memproses...' : 'Daftar'}
        </button>
      </form>
    </AuthLayout>
  );
}