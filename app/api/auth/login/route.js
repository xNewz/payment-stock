import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken, buildAuthCookie } from '@/lib/auth';
import { cookies } from 'next/headers';

// Detect if a string is a Thai phone number (10 digits, starts with 0)
function isPhoneNumber(input) {
  return /^0\d{9}$/.test(input.replace(/[-\s]/g, ''));
}

const rateLimitMap = new Map();
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 mins

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Run every 5 mins

export async function POST(request) {
  try {
    // Check Rate Limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    let limitEntry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    if (now > limitEntry.resetAt) {
      limitEntry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    }
    if (limitEntry.count >= RATE_LIMIT) {
      return NextResponse.json({ error: 'เข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณารอสักครู่' }, { status: 429 });
    }

    const handleAuthFail = () => {
      limitEntry.count += 1;
      rateLimitMap.set(ip, limitEntry);
      return NextResponse.json({ error: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' }, { status: 401 });
    };

    const { username, password } = await request.json();

    if (!username) {
      return handleAuthFail();
    }

    const cleanUsername = username.trim();
    const lookupByPhone = isPhoneNumber(cleanUsername);
    const searchPhone = lookupByPhone ? cleanUsername.replace(/[-\s]/g, '') : cleanUsername;

    console.log(`[Login API] Attempting login for: "${cleanUsername}" (phone: ${lookupByPhone})`);

    // Find user by phone or username
    const user = await prisma.user.findFirst({
      where: lookupByPhone
        ? { phone: searchPhone }
        : { OR: [{ username: cleanUsername }, { phone: cleanUsername }] },
    });

    if (!user) {
      console.log(`[Login API] User "${cleanUsername}" not found`);
      return handleAuthFail();
    }

    // --- Auth Logic ---
    if (user.role === 'ADMIN') {
      // Admin: always requires password
      if (!password) {
        return handleAuthFail();
      }
      const passwordMatch = await bcrypt.compare(password.trim(), user.password);
      if (!passwordMatch) {
        console.log(`[Login API] Password mismatch for admin "${cleanUsername}"`);
        return handleAuthFail();
      }
    } else {
      // Regular USER: phone-only login — no password needed
      if (!lookupByPhone) {
        // If they typed a username (not phone) for a USER account, reject
        return handleAuthFail();
      }
      // No password check for USER role
      console.log(`[Login API] Phone-only login approved for USER "${user.name}"`);
    }

    // Success: clear rate limit for this IP
    rateLimitMap.delete(ip);

    // Issue JWT
    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set(buildAuthCookie(token));

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      // Token mirrored in body so client can persist in localStorage
      // as a fallback for in-app browsers (LINE/Facebook) that drop cookies.
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
