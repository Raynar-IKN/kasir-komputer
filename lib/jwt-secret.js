export function getJwtSecret() {
  const value = process.env.JWT_SECRET;
  if (typeof value !== 'string' || value.length < 32) {
    throw new Error('JWT_SECRET belum diset atau terlalu pendek');
  }
  return new TextEncoder().encode(value);
}
