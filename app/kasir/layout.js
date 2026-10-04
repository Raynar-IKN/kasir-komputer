import Navbar from '@/components/Navbar';
import { getSession } from '@/lib/auth';

export default async function KasirLayout({ children }) {
  const s = await getSession();
  return (
    <>
      <Navbar
        nama={s?.nama}
        role="kasir"
        links={[
          { href: '/kasir', label: 'Kasir' },
          { href: '/kasir/laporan', label: 'Laporan' },
        ]}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </>
  );
}