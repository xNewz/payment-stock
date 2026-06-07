import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

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

    const payments = await prisma.payment.findMany({
      include: {
        user: {
          select: {
            username: true,
            name: true,
          },
        },
        bankAccount: {
          select: {
            bankName: true,
            accountNumber: true,
            accountName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Admin GET payments error:', error);
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

    const { id, status, rejectedReason } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Payment ID and status are required' },
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: parseInt(id, 10) },
      data: {
        status,
        rejectedReason: status === 'REJECTED' ? rejectedReason : null,
      },
      include: {
        user: {
          select: {
            username: true,
            name: true,
          },
        },
        bankAccount: {
          select: {
            bankName: true,
            accountNumber: true,
            accountName: true,
          },
        },
      },
    });

    return NextResponse.json({ payment: updatedPayment });
  } catch (error) {
    console.error('Admin PUT payment error:', error);
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
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({ where: { id: parseInt(id, 10) } });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    await prisma.payment.delete({
      where: { id: parseInt(id, 10) },
    });

    if (payment.slipUrl) {
      try {
        const filename = payment.slipUrl.split('/').pop();
        const filePath = path.join(process.cwd(), 'storage', 'uploads', filename);
        await fs.unlink(filePath);
      } catch (e) {
        console.error('Failed to delete slip file:', e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE payment error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
