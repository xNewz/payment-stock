'use client';

/**
 * Client-side auth helper.
 *
 * Purpose: in-app browsers (LINE, Facebook, Instagram) are unreliable at
 * persisting httpOnly cookies between sessions. localStorage, by contrast,
 * is much more durable. We mirror the JWT into localStorage and attach it
 * as `Authorization: Bearer ...` on every API request so authentication
 * works even when the cookie gets dropped mid-flight.
 *
 * Security note: the JWT is the same secret either way. Token-in-localStorage
 * is a slightly larger XSS blast radius than httpOnly-cookie-only, but this
 * app has no user-generated HTML and the UX cost of cookie-loss (forced
 * re-login every visit) outweighs the marginal risk for this product.
 */

const KEY = 'auth_token';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function saveAuth(token) {
  if (!isBrowser() || !token) return;
  try {
    localStorage.setItem(KEY, token);
  } catch {
    // Private mode / quota exceeded — silently degrade to cookie-only
  }
}

export function getAuth() {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/**
 * Fetch wrapper that auto-attaches Authorization: Bearer header when a
 * token is stored locally. Always includes credentials (cookies) too,
 * so it works in both environments.
 */
export async function authFetch(input, init = {}) {
  const token = getAuth();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    credentials: 'include',
    ...init,
    headers,
  });
}

/**
 * Called by the /login page on mount. If the user already has a valid token
 * in localStorage (cookie was dropped by the in-app browser), POST it to
 * /api/auth/restore — server validates it and re-issues the cookie.
 *
 * Returns { user } on success, null otherwise.
 */
export async function tryRestoreSession() {
  const token = getAuth();
  if (!token) return null;
  try {
    const res = await fetch('/api/auth/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      credentials: 'include',
    });
    if (!res.ok) {
      // Token is expired or invalid — wipe it so we don't keep retrying
      clearAuth();
      return null;
    }
    const data = await res.json();
    if (data?.token) saveAuth(data.token);
    return data?.user || null;
  } catch {
    return null;
  }
}

export async function logoutClient() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore network failure — still clear local state
  }
  clearAuth();
}
