import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(secret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
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