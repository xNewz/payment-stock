import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

async function checkAdmin() {
  const payload = await verifyAuth();
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

/**
 * GET /api/admin/api-tokens
 * List all API tokens (token value is masked except last 8 chars)
 */
export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const tokens = await prisma.apiToken.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Mask token — show generic mask since we only store the hash
    const masked = tokens.map((t) => ({
      id:         t.id,
      name:       t.name,
      tokenMask:  'stv_••••••••••••',
      createdAt:  t.createdAt,
      lastUsedAt: t.lastUsedAt,
      expiresAt:  t.expiresAt,
      isExpired:  t.expiresAt ? new Date(t.expiresAt) < new Date() : false,
    }));

    return NextResponse.json({ tokens: masked });
  } catch (error) {
    console.error('GET api-tokens error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/api-tokens
 * Generate a new API token
 * Body: { name: string, expiresInDays?: number }
 */
export async function POST(request) {
  try {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { name, expiresInDays } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Token name is required' }, { status: 400 });
    }

    // Generate secure token: stv_ prefix + 48 hex chars = 52 chars total
    const rawToken = 'stv_' + randomBytes(24).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    let expiresAt = null;
    if (expiresInDays && Number(expiresInDays) > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
    }

    const created = await prisma.apiToken.create({
      data: {
        name:      name.trim(),
        token:     hashedToken,
        expiresAt,
      },
    });

    // Return full token ONCE — this is the only time it's visible
    return NextResponse.json({
      id:        created.id,
      name:      created.name,
      token:     rawToken,   // full token — show once
      createdAt: created.createdAt,
      expiresAt: created.expiresAt,
    });
  } catch (error) {
    console.error('POST api-tokens error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/api-tokens
 * Revoke (delete) a token
 * Body: { id: number }
 */
export async function DELETE(request) {
  try {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });

    await prisma.apiToken.delete({ where: { id: parseInt(id, 10) } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE api-tokens error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
