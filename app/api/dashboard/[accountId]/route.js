import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { verifyBearerToken } from '@/lib/apiToken';

/**
 * GET /api/dashboard/[accountId]
 *
 * Returns detailed transaction data for a single bank account.
 *
 * Query parameters (all optional):
 *   status     = PENDING | APPROVED | REJECTED
 *   dateFrom   = YYYY-MM-DD   (inclusive, local midnight)
 *   dateTo     = YYYY-MM-DD   (inclusive, local end-of-day)
 *   username   = filter by user's username
 *   page       = page number (default: 1)
 *   limit      = items per page (default: 50, max: 200)
 *
 * Requires: Admin JWT cookie (role = ADMIN)
 */
export async function GET(request, { params }) {
  try {
    // Accept either: Admin session cookie  OR  Bearer API token
    const bearerToken = await verifyBearerToken(request);
    if (!bearerToken) {
      const payload = await verifyAuth();
      if (!payload || payload.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized. Provide a valid Bearer token or Admin session.' }, { status: 401 });
      }
    }

    const { accountId: accountIdParam } = await params;
    const accountId = parseInt(accountIdParam, 10);
    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    // Verify the account exists
    const account = await prisma.bankAccount.findUnique({
      where: { id: accountId },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const statusFilter   = searchParams.get('status');    // PENDING | APPROVED | REJECTED
    const dateFromParam  = searchParams.get('dateFrom');  // YYYY-MM-DD
    const dateToParam    = searchParams.get('dateTo');    // YYYY-MM-DD
    const usernameFilter = searchParams.get('username');  // filter by user
    const page           = Math.max(1, parseInt(searchParams.get('page')  || '1', 10));
    const limit          = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip           = (page - 1) * limit;

    // Build Prisma where clause
    const where = { bankAccountId: accountId };

    if (statusFilter && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusFilter)) {
      where.status = statusFilter;
    }

    if (dateFromParam) {
      const from = new Date(dateFromParam);
      from.setHours(0, 0, 0, 0);
      where.createdAt = { ...where.createdAt, gte: from };
    }

    if (dateToParam) {
      const to = new Date(dateToParam);
      to.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: to };
    }

    if (usernameFilter) {
      where.user = { username: usernameFilter };
    }

    // Fetch with pagination
    const [totalCount, transactions] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, name: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Aggregate stats (across ALL matching records, not just current page)
    const statsResult = await prisma.payment.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      _sum: { amount: true },
    });

    const approved = statsResult.find((r) => r.status === 'APPROVED') || { _count: { _all: 0 }, _sum: { amount: 0 } };
    const pending  = statsResult.find((r) => r.status === 'PENDING') || { _count: { _all: 0 }, _sum: { amount: 0 } };
    const rejected = statsResult.find((r) => r.status === 'REJECTED') || { _count: { _all: 0 }, _sum: { amount: 0 } };

    const totalAllAmount = (approved._sum.amount || 0) + (pending._sum.amount || 0) + (rejected._sum.amount || 0);

    const stats = {
      totalCount,
      approvedCount:       approved._count._all,
      pendingCount:        pending._count._all,
      rejectedCount:       rejected._count._all,
      totalApprovedAmount: approved._sum.amount || 0,
      totalPendingAmount:  pending._sum.amount || 0,
      totalAllAmount:      totalAllAmount,
    };

    return NextResponse.json({
      generatedAt: new Date().toISOString(),

      // Account info
      account: {
        id:            account.id,
        bankName:      account.bankName,
        accountNumber: account.accountNumber,
        accountName:   account.accountName,
        qrType:        account.qrType,
        assignedUserCount: account._count.users,
      },

      // Active filters echoed back
      filters: {
        status:   statusFilter  || null,
        dateFrom: dateFromParam || null,
        dateTo:   dateToParam   || null,
        username: usernameFilter || null,
      },

      // Aggregated stats for the current filter
      stats,

      // Pagination metadata
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },

      // Transaction list
      transactions: transactions.map((p) => {
        const d = p.createdAt;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const randNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
        
        return {
          id:             p.id,
          referenceNumber: `${yyyy}-${mm}-${randNumber}`,
          amount:         p.amount,
          status:         p.status,
          rejectedReason: p.rejectedReason || null,
          slipUrl:        p.slipUrl,
          createdAt:      p.createdAt,
          updatedAt:      p.updatedAt,
          user: {
            id:       p.user.id,
            username: p.user.username,
            name:     p.user.name,
            phone:    p.user.phone || null,
          },
        };
      }),
    });
  } catch (error) {
    console.error('Dashboard [accountId] GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
