'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    router.push(data.role === 'admin' ? '/admin' : '/kasir');
    router.refresh();
  }

  return (
    <AuthLayout
      title="Selamat datang 👋"
      subtitle="Masuk untuk melanjutkan ke aplikasi kasir."
      footer={<>Kasir baru? <Link href="/register" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Daftar di sini</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="alert-error">{error}</div>}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Username</label>
          <input className="input" placeholder="Masukkan username" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Password</label>
          <input type="password" className="input" placeholder="••••••••" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </AuthLayout>
  );
}