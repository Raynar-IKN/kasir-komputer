import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getJwtSecret } from '@/lib/jwt-secret';

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(getJwtSecret());
}

export async function verifyToken(token) {
  const secret = getJwtSecret();
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  const token = store.get('token')?.value;
  return token ? verifyToken(token) : null;
}

export async function requireRole(...roles) {
  const session = await getSession();
  return session && roles.includes(session.role) ? session : null;
}