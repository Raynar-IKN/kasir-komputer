import AdminShell from '@/components/AdminShell';
import { getSession } from '@/lib/auth';

export default async function AdminLayout({ children }) {
  const s = await getSession();
  return <AdminShell nama={s?.nama}>{children}</AdminShell>;
}