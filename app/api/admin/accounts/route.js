import { NextResponse } from 'next/server';
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

    const accounts = await prisma.bankAccount.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Admin GET accounts error:', error);
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

    const { bankName, accountNumber, accountName, qrType } = await request.json();

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: 'Bank name, account number, and account name are required' },
        { status: 400 }
      );
    }

    const newAccount = await prisma.bankAccount.create({
      data: {
        bankName,
        accountNumber,
        accountName,
        qrType: qrType || 'PROMPTPAY',
      },
    });

    return NextResponse.json({ account: newAccount });
  } catch (error) {
    console.error('Admin POST account error:', error);
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

    const { id, bankName, accountNumber, accountName, qrType } = await request.json();

    if (!id || !bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: 'Account ID, bank name, account number, and account name are required' },
        { status: 400 }
      );
    }

    const updatedAccount = await prisma.bankAccount.update({
      where: { id: parseInt(id, 10) },
      data: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        qrType: qrType || 'PROMPTPAY',
      },
    });

    return NextResponse.json({ account: updatedAccount });
  } catch (error) {
    console.error('Admin PUT account error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
