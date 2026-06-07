import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// Detect if a string is a Thai phone number (10 digits, starts with 0)
function isPhoneNumber(input) {
  return /^0\d{9}$/.test(input.replace(/[-\s]/g, ''));
}

const rateLimitMap = new Map();
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 mins

export async function POST(request) {
  try {
    // Check Rate Limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const limitEntry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    if (now > limitEntry.resetAt) {
      limitEntry.count = 0;
      limitEntry.resetAt = now + RATE_LIMIT_WINDOW;
    }
    if (limitEntry.count >= RATE_LIMIT) {
      return NextResponse.json({ error: 'เข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณารอสักครู่' }, { status: 429 });
    }
    limitEntry.count += 1;
    rateLimitMap.set(ip, limitEntry);

    const { username, password } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // --- Auth Logic ---
    if (user.role === 'ADMIN') {
      // Admin: always requires password
      if (!password) {
        return NextResponse.json(
          { error: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' },
          { status: 401 }
        );
      }
      const passwordMatch = await bcrypt.compare(password.trim(), user.password);
      if (!passwordMatch) {
        console.log(`[Login API] Password mismatch for admin "${cleanUsername}"`);
        return NextResponse.json(
          { error: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' },
          { status: 401 }
        );
      }
    } else {
      // Regular USER: phone-only login — no password needed
      if (!lookupByPhone) {
        // If they typed a username (not phone) for a USER account, reject
        return NextResponse.json(
          { error: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' },
          { status: 401 }
        );
      }
      // No password check for USER role
      console.log(`[Login API] Phone-only login approved for USER "${user.name}"`);
    }

    // Issue JWT
    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
