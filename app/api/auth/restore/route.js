import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken, signToken, buildAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Restore an auth cookie from a Bearer token stored client-side (localStorage).
 *
 * Why this exists:
 *   In-app browsers (LINE, Facebook) frequently clear cookies between sessions
 *   but persist localStorage. The /login page checks localStorage on boot —
 *   if a token is present and still valid, it calls this endpoint to rebuild
 *   the httpOnly cookie so SSR-protected pages work again.
 *
 * Body: { token: string }
 * Returns: { user, token } on success — client should refresh its stored token.
 */
export async function POST(request) {
  try {
    const { token } = await request.json().catch(() => ({}));

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    // Confirm the user still exists and the role hasn't changed
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, username: true, name: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 401 });
    }

    // Re-issue a fresh token so the 7-day window slides forward
    const fresh = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set(buildAuthCookie(fresh));

    return NextResponse.json({ user, token: fresh });
  } catch (err) {
    console.error('Restore endpoint error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
