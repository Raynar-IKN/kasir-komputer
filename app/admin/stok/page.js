'use client';
import { useEffect, useState } from 'react';
import { stokBadge } from '@/lib/ui';
import { EmptyState, ErrorState, LoadingState } from '@/components/AdminStates';

const movementBadge = (type) => type === 'baru' ? 'badge-accent' : type === 'masuk' ? 'badge-primary' : 'badge-muted';
const movementLabel = (type) => ({ baru: 'Baru', masuk: 'Masuk', keluar: 'Keluar' })[type] || type;

export default function UpdateStokPage() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState('');
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('masuk');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [movementError, setMovementError] = useState('');
  const [success, setSuccess] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/products').then(async (response) => ({ response, data: await response.json() })),
      fetch('/api/stock-movements').then(async (response) => ({ response, data: await response.json() })),
    ]).then(([productResult, movementResult]) => {
      if (!active) return;
      if (!productResult.response.ok) throw new Error(productResult.data.error || 'Gagal memuat barang.');
      if (!movementResult.response.ok) throw new Error(movementResult.data.error || 'Gagal memuat pergerakan stok.');
      setProducts(productResult.data);
      setMovements(movementResult.data.rows.slice(0, 10));
      setError('');
      setMovementError('');
      setLoading(false);
    }).catch((requestError) => {
      if (!active) return;
      setError(requestError.message || 'Gagal memuat data stok.');
      setMovementError(requestError.message || 'Gagal memuat pergerakan stok.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [retry]);

  const visibleProducts = products.filter((product) =>
    `${product.kode} ${product.nama}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  const selectedProduct = products.find((product) => String(product.id) === productId);
  const amount = Number(quantity);
  const validAmount = Number.isSafeInteger(amount) && amount >= 1;
  const afterStock = selectedProduct && validAmount
    ? Number(selectedProduct.stok) + (type === 'masuk' ? amount : -amount)
    : null;
  const insufficient = type === 'keluar' && afterStock !== null && afterStock < 0;

  function reload() {
    setLoading(true);
    setRetry((value) => value + 1);
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedProduct || !validAmount || (type === 'keluar' && !note.trim()) || insufficient) {
      setError(insufficient ? `Stok tidak cukup, sisa ${selectedProduct?.stok ?? 0}.` : 'Lengkapi barang, jumlah, dan keterangan yang diwajibkan.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: Number(productId), tipe: type, jumlah: amount, keterangan: note.trim() || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan pergerakan stok.');
      setSuccess(`Stok berhasil diperbarui menjadi ${result.stok_sesudah}.`);
      setQuantity('1');
      setNote('');
      reload();
    } catch (requestError) {
      setError(requestError.message || 'Gagal menyimpan pergerakan stok.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Update Stok</h1>
        <p className="mt-1 text-sm text-muted">Catat barang masuk dan barang keluar secara terpisah dari katalog.</p>
      </header>

      <form onSubmit={submit} className="card space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label" htmlFor="stock-search">Cari barang
            <input id="stock-search" className="input mt-1.5" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ketik kode atau nama barang" />
          </label>
          <label className="label" htmlFor="stock-product">Barang
            <select id="stock-product" className="select mt-1.5" value={productId} onChange={(event) => setProductId(event.target.value)} required>
              <option value="">Pilih barang</option>
              {visibleProducts.map((product) => (
                <option key={product.id} value={product.id}>{product.kode} - {product.nama} (stok {product.stok})</option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="label mb-2">Jenis pergerakan</legend>
          <div className="segmented w-full sm:w-auto" role="group" aria-label="Jenis pergerakan stok">
            <button type="button" className="flex-1 sm:flex-none" aria-pressed={type === 'masuk'} onClick={() => setType('masuk')}>Barang Masuk</button>
            <button type="button" className="flex-1 sm:flex-none" aria-pressed={type === 'keluar'} onClick={() => setType('keluar')}>Barang Keluar</button>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label" htmlFor="stock-quantity">Jumlah
            <input id="stock-quantity" type="number" min="1" step="1" className="input mt-1.5" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
          </label>
          <label className="label" htmlFor="stock-note">Keterangan {type === 'keluar' ? '(wajib)' : '(opsional)'}
            <input id="stock-note" className="input mt-1.5" value={note} onChange={(event) => setNote(event.target.value)} maxLength={255} placeholder={type === 'keluar' ? 'Contoh: rusak, hilang, retur' : 'Contoh: pembelian stok'} required={type === 'keluar'} />
          </label>
        </div>

        <div className={`rounded-md p-4 text-sm ${insufficient ? 'bg-danger/10 text-danger' : 'bg-primary-soft text-primary'}`}>
          Stok setelah perubahan: <strong>{afterStock === null ? '—' : afterStock}</strong>
          {insufficient && <span className="ml-2">Jumlah keluar melebihi stok tersedia.</span>}
        </div>
        {error && <ErrorState message={error} />}
        {success && <p className="rounded-md bg-accent-soft p-3 text-sm text-accent" role="status">{success}</p>}
        <button type="submit" className="btn btn-primary" disabled={submitting || loading || !selectedProduct || !validAmount || insufficient || (type === 'keluar' && !note.trim())}>
          {submitting ? 'Menyimpan...' : 'Simpan Pergerakan'}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">10 Pergerakan Stok Terbaru</h2>
        {movementError && <ErrorState message={movementError} onRetry={reload} />}
        {loading ? <LoadingState label="Memuat pergerakan stok..." /> : !movementError && movements.length === 0 ? (
          <EmptyState>Belum ada pergerakan stok pada periode ini.</EmptyState>
        ) : !movementError && (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
              <div className="overflow-x-auto">
                <table className="tbl min-w-[900px]">
                  <thead><tr><th>Tanggal</th><th>Barang</th><th>Tipe</th><th>Jumlah</th><th>Stok Sebelum</th><th>Stok Sesudah</th><th>Keterangan</th><th>Oleh</th></tr></thead>
                  <tbody>{movements.map((row) => (
                    <tr key={row.id}>
                      <td>{row.created_at}</td>
                      <td><span className="font-mono text-sm text-muted">{row.kode}</span><br />{row.nama_produk}</td>
                      <td><span className={`badge ${movementBadge(row.tipe)}`}>{movementLabel(row.tipe)}</span></td>
                      <td>{row.jumlah}</td><td>{row.stok_sebelum}</td><td>{row.stok_sesudah}</td>
                      <td>{row.keterangan || '—'}</td><td>{row.pengguna}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
            <div className="grid gap-3 md:hidden">
              {movements.map((row) => (
                <article className="card space-y-3 p-4" key={row.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate font-semibold">{row.nama_produk}</p><p className="mt-1 font-mono text-sm text-muted">{row.kode}</p></div>
                    <span className={`badge shrink-0 ${movementBadge(row.tipe)}`}>{movementLabel(row.tipe)}</span>
                  </div>
                  <p className="text-sm text-muted">{row.created_at}</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-muted">Jumlah</p><p className="mt-1 font-semibold">{row.jumlah}</p></div>
                    <div><p className="text-muted">Sebelum</p><p className="mt-1">{row.stok_sebelum}</p></div>
                    <div><p className="text-muted">Sesudah</p><p className="mt-1">{row.stok_sesudah}</p></div>
                  </div>
                  <p className="text-sm">{row.keterangan || '—'} <span className="text-muted">· {row.pengguna}</span></p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}