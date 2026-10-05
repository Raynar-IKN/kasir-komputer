import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/jwt-secret';

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;
  const secret = getJwtSecret();

  let user = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      user = payload;
    } catch {}
  }

  const go = (path) => NextResponse.redirect(new URL(path, req.url));
  const home = user?.role === 'admin' ? '/admin' : '/kasir';
  const isAuthPage = pathname === '/login';

  if (pathname === '/') return go(user ? home : '/login');
  if (!user && !isAuthPage) return go('/login');
  if (user && isAuthPage) return go(home);
  if (pathname.startsWith('/admin') && user.role !== 'admin') return go(home);
  if (pathname.startsWith('/kasir') && user.role !== 'kasir') return go(home);

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/kasir/:path*'],
};