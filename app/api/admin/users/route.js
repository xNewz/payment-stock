import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Helper to check admin access
async function checkAdmin() {
  const payload = await verifyAuth();
  if (!payload || payload.role !== 'ADMIN') {
    return null;
  }
  return payload;
}

export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        phone: true,
        name: true,
        role: true,
        assignedAccountId: true,
        assignedAccount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin GET users error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { username, phone, password, name, role, assignedAccountId } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Username, password, and name are required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const cleanPhone = phone ? phone.trim() : null;

    // Check if user already exists by username or phone number
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          cleanPhone ? { phone: cleanPhone } : undefined
        ].filter(Boolean)
      },
    });

    if (existingUser) {
      const field = existingUser.username === cleanUsername ? 'Username' : 'Phone number';
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 400 }
      );
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        phone: cleanPhone,
        password: hashedPassword,
        name: name.trim(),
        role: role || 'USER',
        assignedAccountId: assignedAccountId ? parseInt(assignedAccountId, 10) : null,
      },
      select: {
        id: true,
        username: true,
        phone: true,
        name: true,
        role: true,
        assignedAccountId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('Admin POST user error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, username, phone, password, name, role, assignedAccountId } = await request.json();

    if (!id || !username || !name) {
      return NextResponse.json(
        { error: 'User ID, username, and name are required' },
        { status: 400 }
      );
    }

    const userId = parseInt(id, 10);
    const cleanUsername = username.trim();
    const cleanPhone = phone ? phone.trim() : null;

    // Check if username or phone is taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          cleanPhone ? { phone: cleanPhone } : undefined
        ].filter(Boolean),
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      const field = existingUser.username === cleanUsername ? 'Username' : 'Phone number';
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 400 }
      );
    }

    const dataToUpdate = {
      username: cleanUsername,
      phone: cleanPhone,
      name: name.trim(),
      role: role || 'USER',
      assignedAccountId: assignedAccountId ? parseInt(assignedAccountId, 10) : null,
    };

    if (password && password.trim() !== '') {
      dataToUpdate.password = bcrypt.hashSync(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        phone: true,
        name: true,
        role: true,
        assignedAccountId: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Admin PUT user error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userId = parseInt(id, 10);

    // Prevent deleting the currently logged-in admin
    if (userId === admin.id) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบบัญชีของตัวเองได้' },
        { status: 400 }
      );
    }

    // Delete user's payments first (cascade)
    await prisma.payment.deleteMany({ where: { userId } });

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE user error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
