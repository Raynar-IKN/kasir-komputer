'use client';
import { useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/AdminStates';

function MemberModal({ member, onClose, onSaved }) {
  const [nama, setNama] = useState(member.nama);
  const [phone, setPhone] = useState(member.no_telp);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: nama.trim(), no_telp: phone }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal memperbarui member.');
      onSaved();
    } catch (requestError) {
      setError(requestError.message || 'Gagal memperbarui member.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-lg border border-line bg-surface p-5 shadow-xl sm:max-w-lg sm:rounded-lg" role="dialog" aria-modal="true" aria-labelledby="edit-member-title">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="edit-member-title" className="text-lg font-semibold">Edit Member</h2>
          <button type="button" className="btn-icon" aria-label="Tutup" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="label" htmlFor="edit-member-name">Nama
            <input id="edit-member-name" className="input mt-1.5" value={nama} onChange={(event) => setNama(event.target.value)} maxLength={100} required />
          </label>
          <label className="label" htmlFor="edit-member-phone">No. Telepon
            <input id="edit-member-phone" className="input mt-1.5" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="contoh 081234567890" required />
          </label>
          {error && <ErrorState message={error} />}
          <div className="flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
        </form>
      </section>
    </div>
  );
}

export default function MemberPage() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ nama: '', no_telp: '' });
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(`/api/members${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memuat member.');
        return result;
      })
      .then((result) => {
        if (!active) return;
        setMembers(result);
        setError('');
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || 'Gagal memuat member.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [query, retry]);

  function reload() {
    setLoading(true);
    setRetry((value) => value + 1);
  }

  async function addMember(event) {
    event.preventDefault();
    setFormError('');
    if (!form.nama.trim() || !form.no_telp.trim()) {
      setFormError('Nama dan nomor telepon wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: form.nama.trim(), no_telp: form.no_telp.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menambahkan member.');
      setForm({ nama: '', no_telp: '' });
      reload();
    } catch (requestError) {
      setFormError(requestError.message || 'Gagal menambahkan member.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold">Member</h1><p className="mt-1 text-sm text-muted">Simpan pelanggan dan nomor telepon yang sudah dinormalisasi.</p></header>

      <form onSubmit={addMember} className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">Tambah Member</h2>
        <label className="label" htmlFor="member-name">Nama
          <input id="member-name" className="input mt-1.5" value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} maxLength={100} required />
        </label>
        <label className="label" htmlFor="member-phone">No. Telepon
          <input id="member-phone" className="input mt-1.5" type="tel" value={form.no_telp} onChange={(event) => setForm({ ...form, no_telp: event.target.value })} placeholder="contoh 081234567890" required />
        </label>
        {formError && <div className="sm:col-span-2"><ErrorState message={formError} /></div>}
        <div className="sm:col-span-2"><button className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Tambah Member'}</button></div>
      </form>

      <section className="space-y-4">
        <form onSubmit={(event) => { event.preventDefault(); setLoading(true); setQuery(searchInput.trim()); }} className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="member-search">Cari member</label>
          <input id="member-search" className="input min-w-0 flex-1" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Cari nama, telepon, atau kode member" />
          <button className="btn btn-ghost">Cari</button>
        </form>
        {error && <ErrorState message={error} onRetry={reload} />}
        {loading ? <LoadingState label="Memuat daftar member..." /> : !error && members.length === 0 ? (
          <EmptyState>{query ? 'Member tidak ditemukan.' : 'Belum ada member.'}</EmptyState>
        ) : !error && (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
              <div className="overflow-x-auto"><table className="tbl min-w-[760px]">
                <thead><tr><th>Kode Member</th><th>Nama</th><th>No. Telepon</th><th>Tanggal Daftar</th><th>Aksi</th></tr></thead>
                <tbody>{members.map((member) => (
                  <tr key={member.id}><td className="font-mono text-sm text-muted">{member.kode_member}</td><td className="font-medium">{member.nama}</td><td>{member.no_telp}</td><td>{member.created_at}</td><td><button type="button" className="btn btn-ghost" onClick={() => setEditing(member)}>Edit</button></td></tr>
                ))}</tbody>
              </table></div>
            </div>
            <div className="grid gap-3 md:hidden">{members.map((member) => (
              <article key={member.id} className="card space-y-3 p-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{member.nama}</p><p className="mt-1 font-mono text-sm text-muted">{member.kode_member}</p></div><button type="button" className="btn btn-ghost shrink-0" onClick={() => setEditing(member)}>Edit</button></div>
                <p className="text-sm">{member.no_telp}</p><p className="text-sm text-muted">Terdaftar {member.created_at}</p>
              </article>
            ))}</div>
          </>
        )}
      </section>
      {editing && <MemberModal member={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}