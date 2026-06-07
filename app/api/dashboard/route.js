import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { verifyBearerToken } from '@/lib/apiToken';

/**
 * GET /api/dashboard
 *
 * Returns a summary of all bank accounts with their transaction stats.
 * Also lists available per-account API endpoints dynamically.
 *
 * Requires: Admin JWT cookie (role = ADMIN)
 */
export async function GET(request) {
  try {
    // Accept either: Admin session cookie  OR  Bearer API token
    const bearerToken = await verifyBearerToken(request);
    if (!bearerToken) {
      const payload = await verifyAuth();
      if (!payload || payload.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized. Provide a valid Bearer token or Admin session.' }, { status: 401 });
      }
    }

    // Fetch all accounts with aggregated payment stats
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    // Build summary per account
    const summary = accounts.map((acc) => {
      const allPayments = acc.payments;
      const approved = allPayments.filter((p) => p.status === 'APPROVED');
      const pending  = allPayments.filter((p) => p.status === 'PENDING');
      const rejected = allPayments.filter((p) => p.status === 'REJECTED');

      const totalApprovedAmount = approved.reduce((s, p) => s + p.amount, 0);

      return {
        accountId:         acc.id,
        bankName:          acc.bankName,
        accountNumber:     acc.accountNumber,
        accountName:       acc.accountName,
        qrType:            acc.qrType,
        assignedUserCount: acc._count.users,
        stats: {
          totalTransactions:   allPayments.length,
          approvedCount:       approved.length,
          pendingCount:        pending.length,
          rejectedCount:       rejected.length,
          totalApprovedAmount: totalApprovedAmount,
        },
        // Dynamic link to the per-account endpoint
        endpoint: `/api/dashboard/${acc.id}`,
      };
    });

    // Overall totals across all accounts
    const allPaymentsFlat = accounts.flatMap((a) => a.payments);
    const grandTotalApproved = allPaymentsFlat
      .filter((p) => p.status === 'APPROVED')
      .reduce((s, p) => s + p.amount, 0);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totalAccounts:         accounts.length,
      totalTransactions:     allPaymentsFlat.length,
      totalApprovedAmount:   grandTotalApproved,
      totalPending:          allPaymentsFlat.filter((p) => p.status === 'PENDING').length,
      accounts: summary,
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
