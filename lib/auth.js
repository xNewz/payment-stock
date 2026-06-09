import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required in environment variables.');
}

export const TOKEN_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify a raw JWT string. Returns payload or null.
 * Used by the /api/auth/restore endpoint and anywhere else that
 * needs to validate a token from a non-cookie source.
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Verify the current request's auth.
 * Reads the `token` cookie first (default), then falls back to
 * `Authorization: Bearer <token>` header (used by in-app browsers
 * like LINE/Facebook where cookies are unreliable).
 */
export async function verifyAuth() {
  const cookieStore = await cookies();
  let token = cookieStore.get('token')?.value;

  if (!token) {
    try {
      const h = await headers();
      const auth = h.get('authorization') || h.get('Authorization') || '';
      if (auth.startsWith('Bearer ')) {
        token = auth.slice(7).trim();
      }
    } catch {
      // headers() may throw outside of a request scope — ignore
    }
  }

  return verifyToken(token);
}

export function buildAuthCookie(token) {
  return {
    name: 'token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_MAX_AGE_SEC,
  };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.set('token', '', { maxAge: 0, path: '/' });
}
