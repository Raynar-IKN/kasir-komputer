'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { METODE } from '@/lib/constants';
import { rp } from '@/lib/pdf';
import { stokBadge } from '@/lib/ui';

export default function KasirPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [qty, setQty] = useState({});
  const [cart, setCart] = useState([]); // { id, nama, harga, qty, stok }
  const [bayar, setBayar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [memberMode, setMemberMode] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [member, setMember] = useState(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [metode, setMetode] = useState('tunai');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' }).then((r) => r.json()).then(setProducts);
  }, []);

  useEffect(() => {
    if (!checkoutOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => { if (event.key === 'Escape') setCheckoutOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [checkoutOpen]);

  const filtered = products.filter(
    (p) =>
      p.nama.toLowerCase().includes(q.toLowerCase()) ||
      p.kode.toLowerCase().includes(q.toLowerCase()) ||
      p.kategori.toLowerCase().includes(q.toLowerCase())
  );
  const total = cart.reduce((s, i) => s + i.harga * i.qty, 0);
  const kembalian = Number(bayar) - total;
  const cashPayment = metode === 'tunai';
  const cashValid = bayar !== '' && Number.isSafeInteger(Number(bayar)) && Number(bayar) >= total;
  const memberValid = !memberMode || Boolean(member);
  const canPay = cart.length > 0 && memberValid && (!cashPayment || cashValid);
  const jumlahItem = cart.reduce((sum, item) => sum + item.qty, 0);

  function tambah(p) {
    const jumlah = Number(qty[p.id] || 1);
    if (jumlah < 1) return;
    const ada = cart.find((c) => c.id === p.id);
    const baru = (ada?.qty || 0) + jumlah;
    if (baru > p.stok) return setError(`Stok ${p.nama} hanya ${p.stok}`);
    setError('');
    setCart(
      ada
        ? cart.map((c) => (c.id === p.id ? { ...c, qty: baru } : c))
        : [...cart, { id: p.id, nama: p.nama, harga: p.harga, qty: jumlah, stok: p.stok }]
    );
  }

  function ubah(id, delta) {
    setCart(cart.map((c) => (c.id === id ? { ...c, qty: Math.min(c.stok, Math.max(1, c.qty + delta)) } : c)));
  }

  function pilihModeMember(useMember) {
    setMemberMode(useMember);
    setMember(null);
    setMemberPhone('');
    setMemberError('');
  }

  async function cariMember() {
    if (!memberPhone.trim()) {
      setMemberError('Masukkan nomor telepon member.');
      setMember(null);
      return;
    }
    setMemberLoading(true);
    setMemberError('');
    setMember(null);
    try {
      const response = await fetch(`/api/members/lookup?telp=${encodeURIComponent(memberPhone.trim())}`);
      const result = await response.json();
      if (!response.ok) {
        setMemberError(response.status === 404 ? 'Member tidak ditemukan' : result.error || 'Gagal mencari member.');
        return;
      }
      setMember(result);
    } catch {
      setMemberError('Gagal menghubungi server. Periksa koneksi lalu coba lagi.');
    } finally {
      setMemberLoading(false);
    }
  }

  async function prosesBayar() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({ product_id: c.id, qty: c.qty })),
          metode_pembayaran: metode,
          bayar: cashPayment ? Number(bayar) : total,
          member_id: memberMode ? member.id : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Transaksi gagal diproses.');
        return;
      }

      setCart([]);
      setBayar('');
      setMember(null);
      setMemberPhone('');
      setMemberMode(false);
      setMetode('tunai');
      setCheckoutOpen(false);
      try {
        const productsResponse = await fetch('/api/products', { cache: 'no-store' });
        if (productsResponse.ok) setProducts(await productsResponse.json());
      } catch {}
      router.push(`/kasir/struk/${data.id}`);
    } catch {
      setError('Gagal menghubungi server. Periksa koneksi lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 pb-28 lg:grid-cols-3 lg:pb-0">
      {/* DAFTAR BARANG */}
      <section className="space-y-4 lg:col-span-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Barang</h1>
          <p className="text-sm text-muted">Pilih barang dan jumlahnya, lalu tambahkan ke keranjang.</p>
        </div>

        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input className="input pl-11" placeholder="Cari nama, kode, atau kategori..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="card flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <span className="badge badge-primary">{p.kategori}</span>
                <span className={`badge ${stokBadge(p.stok)}`}>Stok {p.stok}</span>
              </div>
              <h3 className="mt-3 font-semibold leading-snug">{p.nama}</h3>
              <p className="text-sm text-muted">{p.kode}</p>
              <p className="mt-2 text-lg font-bold text-primary">{rp(p.harga)}</p>
              <div className="mt-auto flex gap-2 pt-4">
                <div className="w-20 shrink-0">
                  <input type="number" min="1" className="input text-center" value={qty[p.id] ?? 1}
                    onChange={(e) => setQty({ ...qty, [p.id]: e.target.value })} />
                </div>
                <button disabled={p.stok === 0} onClick={() => tambah(p)} className="btn btn-primary flex-1">
                  {p.stok === 0 ? 'Habis' : 'Tambah'}
                </button>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <p className="col-span-full py-10 text-center text-muted">Barang tidak ditemukan.</p>
          )}
        </div>
      </section>

      {checkoutOpen && <button type="button" className="fixed inset-0 z-40 bg-ink/55 lg:hidden" aria-label="Tutup checkout" onClick={() => setCheckoutOpen(false)} />}

      {/* KERANJANG */}
      <aside className={`card fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] w-full overflow-y-auto rounded-t-lg p-5 shadow-xl transition-transform duration-300 lg:sticky lg:inset-auto lg:top-20 lg:z-auto lg:col-span-1 lg:max-h-[calc(100dvh-6rem)] lg:w-full lg:visible lg:translate-y-0 lg:rounded-lg lg:shadow-sm ${checkoutOpen ? 'visible translate-y-0' : 'invisible translate-y-full'}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Keranjang</h2>
          <button type="button" className="btn-icon lg:hidden" aria-label="Tutup checkout" onClick={() => setCheckoutOpen(false)}>×</button>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-md border border-dashed border-line py-8 text-center text-sm text-muted">
            Belum ada barang dipilih.
          </div>
        ) : (
          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {cart.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 border-b border-line pb-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.nama}</p>
                  <p className="text-sm text-muted">{rp(c.harga)}</p>
                  <div className="mt-2 inline-flex items-center overflow-hidden rounded-md border border-line">
                    <button aria-label={`Kurangi jumlah ${c.nama}`} onClick={() => ubah(c.id, -1)} className="min-h-10 min-w-10 hover:bg-page">−</button>
                    <span className="min-w-8 text-center text-sm">{c.qty}</span>
                    <button aria-label={`Tambah jumlah ${c.nama}`} onClick={() => ubah(c.id, 1)} className="min-h-10 min-w-10 hover:bg-page">+</button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{rp(c.harga * c.qty)}</p>
                  <button onClick={() => setCart(cart.filter((x) => x.id !== c.id))} className="mt-1 min-h-10 text-sm text-muted hover:text-primary">
                    hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-4 border-t border-line pt-4">
          <div className="flex items-center justify-between rounded-md bg-page px-4 py-3">
            <span className="text-sm text-muted">Total</span>
            <span className="text-xl font-bold">{rp(total)}</span>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Pilihan Member</h3>
            <div className="segmented grid w-full grid-cols-2" role="group" aria-label="Pilihan member">
              <button type="button" aria-pressed={!memberMode} onClick={() => pilihModeMember(false)}>Bukan Member</button>
              <button type="button" aria-pressed={memberMode} onClick={() => pilihModeMember(true)}>Member</button>
            </div>
            {memberMode && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input type="tel" className="input min-w-0 flex-1" placeholder="Nomor telepon member" value={memberPhone} onChange={(event) => { setMemberPhone(event.target.value); setMember(null); setMemberError(''); }} />
                  <button type="button" className="btn btn-ghost shrink-0" onClick={cariMember} disabled={memberLoading || !memberPhone.trim()}>{memberLoading ? 'Mencari...' : 'Cari'}</button>
                </div>
                {memberError && <p className="text-sm text-danger" role="alert">{memberError}</p>}
                {member && (
                  <div className="flex items-center gap-3 rounded-md border border-accent/30 bg-accent-soft p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-white" aria-hidden="true">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                    </span>
                    <div className="min-w-0"><p className="truncate font-semibold">{member.nama}</p><p className="mt-1 text-sm text-muted">{member.kode_member}</p></div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Metode Pembayaran</h3>
            <div className="grid grid-cols-2 gap-2">
              {METODE.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  aria-pressed={metode === method.value}
                  onClick={() => setMetode(method.value)}
                  className={`btn min-h-11 border ${metode === method.value ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface text-ink hover:bg-page'}`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </section>

          {cashPayment ? (
            <div className="space-y-2">
              <label className="label" htmlFor="cash-payment">Uang Bayar</label>
              <div className="flex gap-2">
                <input id="cash-payment" type="number" min="0" step="1" className="input min-w-0 flex-1" placeholder="Masukkan nominal" value={bayar} onChange={(event) => setBayar(event.target.value)} />
                <button type="button" onClick={() => setBayar(String(total))} disabled={!total} className="btn btn-ghost shrink-0">Pas</button>
              </div>
              {bayar !== '' && <p className={`text-sm font-medium ${kembalian < 0 ? 'text-danger' : 'text-accent'}`}>{kembalian < 0 ? `Kurang ${rp(-kembalian)}` : `Kembalian ${rp(kembalian)}`}</p>}
            </div>
          ) : <p className="rounded-md bg-primary-soft p-3 text-sm text-primary">Pembayaran non-tunai: nominal sesuai total</p>}

          {error && <div className="alert-error">{error}</div>}

          <button onClick={prosesBayar} disabled={loading || !canPay}
            className="btn btn-accent w-full py-3">
            {loading ? 'Memproses...' : 'Bayar Sekarang'}
          </button>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0"><p className="truncate text-sm font-medium">Keranjang ({jumlahItem} item)</p><p className="truncate text-sm font-bold text-primary">{rp(total)}</p></div>
          <button type="button" className="btn btn-primary shrink-0" onClick={() => setCheckoutOpen(true)}>Lihat</button>
        </div>
      </div>
    </div>
  );
}