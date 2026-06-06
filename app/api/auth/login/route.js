import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// Detect if a string is a Thai phone number (10 digits, starts with 0)
function isPhoneNumber(input) {
  return /^0\d{9}$/.test(input.replace(/[-\s]/g, ''));
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อผู้ใช้งาน หรือเบอร์โทรศัพท์' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const lookupByPhone = isPhoneNumber(cleanUsername);

    console.log(`[Login API] Attempting login for: "${cleanUsername}" (phone: ${lookupByPhone})`);

    // Find user by phone or username
    const user = await prisma.user.findFirst({
      where: lookupByPhone
        ? { phone: cleanUsername }
        : { OR: [{ username: cleanUsername }, { phone: cleanUsername }] },
    });

    if (!user) {
      console.log(`[Login API] User "${cleanUsername}" not found`);
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้งานในระบบ กรุณาติดต่อผู้ดูแล' },
        { status: 401 }
      );
    }

    // --- Auth Logic ---
    if (user.role === 'ADMIN') {
      // Admin: always requires password
      if (!password) {
        return NextResponse.json(
          { error: 'ผู้ดูแลระบบต้องใส่รหัสผ่าน' },
          { status: 400 }
        );
      }
      const passwordMatch = bcrypt.compareSync(password.trim(), user.password);
      if (!passwordMatch) {
        console.log(`[Login API] Password mismatch for admin "${cleanUsername}"`);
        return NextResponse.json(
          { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
          { status: 401 }
        );
      }
    } else {
      // Regular USER: phone-only login — no password needed
      if (!lookupByPhone) {
        // If they typed a username (not phone) for a USER account, reject
        return NextResponse.json(
          { error: 'ผู้ใช้งานทั่วไปต้องเข้าสู่ระบบด้วยเบอร์โทรศัพท์' },
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
