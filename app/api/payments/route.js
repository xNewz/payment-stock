import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      where: { userId: payload.id },
      include: {
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
    console.error('GET payments error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const amountStr = formData.get('amount');
    const bankAccountIdStr = formData.get('bankAccountId');

    if (!file || !amountStr || !bankAccountIdStr) {
      return NextResponse.json(
        { error: 'Missing required fields (file, amount, or bankAccountId)' },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const bankAccountId = parseInt(bankAccountIdStr, 10);
    if (isNaN(bankAccountId)) {
      return NextResponse.json(
        { error: 'Invalid bank account ID' },
        { status: 400 }
      );
    }

    // Verify bank account exists
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });
    if (!bankAccount) {
      return NextResponse.json(
        { error: 'Bank account not found' },
        { status: 404 }
      );
    }

    // Verify user assignment
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (user.assignedAccountId && user.assignedAccountId !== bankAccountId) {
      return NextResponse.json(
        { error: 'คุณไม่ได้รับอนุญาตให้โอนเงินเข้าบัญชีนี้' },
        { status: 403 }
      );
    }

    // Validate file type and size
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'ขนาดไฟล์เกิน 5MB' }, { status: 413 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'อนุญาตเฉพาะไฟล์รูปภาพ (JPEG, PNG, WEBP)' }, { status: 415 });
    }

    // Read file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directory exists in storage/uploads
    const uploadDir = path.join(process.cwd(), 'storage', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Sanitize filename to avoid paths traversal issues and use UUID for uniqueness
    const ext = path.extname(file.name).toLowerCase();
    const sanitizedFilename = `${payload.id}_${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, sanitizedFilename);
    await fs.writeFile(filePath, buffer);

    const slipUrl = `/uploads/${sanitizedFilename}`;

    const newPayment = await prisma.payment.create({
      data: {
        userId: payload.id,
        bankAccountId,
        amount,
        slipUrl,
        status: 'PENDING',
      },
      include: {
        bankAccount: {
          select: {
            bankName: true,
            accountNumber: true,
            accountName: true,
          },
        },
      },
    });

    return NextResponse.json({ payment: newPayment });
  } catch (error) {
    console.error('POST payment error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
