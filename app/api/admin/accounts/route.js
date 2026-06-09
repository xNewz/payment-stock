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

    const { bankName, accountNumber, accountName, qrType, remark } = await request.json();

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: 'Bank name, account number, and account name are required' },
        { status: 400 }
      );
    }

    // Cap remark length to a sensible upper bound to avoid abuse
    const safeRemark =
      typeof remark === 'string' ? remark.trim().slice(0, 2000) : null;

    const newAccount = await prisma.bankAccount.create({
      data: {
        bankName,
        accountNumber,
        accountName,
        qrType: qrType || 'PROMPTPAY',
        remark: safeRemark || null,
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

    const body = await request.json();
    const { id, bankName, accountNumber, accountName, qrType, remark } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Partial update mode: only `remark` provided (used by the Remark modal)
    const isRemarkOnly =
      Object.prototype.hasOwnProperty.call(body, 'remark') &&
      bankName === undefined &&
      accountNumber === undefined &&
      accountName === undefined &&
      qrType === undefined;

    if (!isRemarkOnly && (!bankName || !accountNumber || !accountName)) {
      return NextResponse.json(
        { error: 'Bank name, account number, and account name are required' },
        { status: 400 }
      );
    }

    const data = {};
    if (bankName !== undefined) data.bankName = String(bankName).trim();
    if (accountNumber !== undefined) data.accountNumber = String(accountNumber).trim();
    if (accountName !== undefined) data.accountName = String(accountName).trim();
    if (qrType !== undefined) data.qrType = qrType || 'PROMPTPAY';
    if (Object.prototype.hasOwnProperty.call(body, 'remark')) {
      const safe =
        typeof remark === 'string' ? remark.trim().slice(0, 2000) : '';
      data.remark = safe.length ? safe : null;
    }

    const updatedAccount = await prisma.bankAccount.update({
      where: { id: parseInt(id, 10) },
      data,
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

export async function DELETE(request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const accountId = parseInt(id, 10);

    // Check if account is still assigned to any user
    const linkedUsers = await prisma.user.count({
      where: { assignedAccountId: accountId },
    });

    if (linkedUsers > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้ เนื่องจากบัญชีนี้ยังถูกกำหนดให้ผู้ใช้งาน ${linkedUsers} คน กรุณาเปลี่ยนบัญชีให้ผู้ใช้เหล่านั้นก่อน` },
        { status: 400 }
      );
    }

    // Check if there are payments linked to this account
    const linkedPayments = await prisma.payment.count({
      where: { bankAccountId: accountId },
    });

    if (linkedPayments > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้ เนื่องจากมีรายการชำระเงิน ${linkedPayments} รายการที่ผูกกับบัญชีนี้อยู่ กรุณาลบรายการชำระเงินเหล่านั้นก่อน` },
        { status: 400 }
      );
    }

    await prisma.bankAccount.delete({ where: { id: accountId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE account error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
