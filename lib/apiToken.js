import prisma from '@/lib/prisma';
import { createHash } from 'crypto';

/**
 * Verify a Bearer API token from the Authorization header.
 * Also updates lastUsedAt on valid use.
 *
 * @param {Request} request - Next.js Request object
 * @returns {object|null} token record or null if invalid/expired
 */
export async function verifyBearerToken(request) {
  let rawToken = '';

  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.slice(7).trim();
  }

  // Fallback to query parameter if no Bearer token is provided
  if (!rawToken) {
    const url = new URL(request.url);
    rawToken = url.searchParams.get('token') || url.searchParams.get('apiKey') || '';
  }

  if (!rawToken) return null;

  try {
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const tokenRecord = await prisma.apiToken.findUnique({
      where: { token: hashedToken },
    });

    if (!tokenRecord) return null;

    // Check expiry
    if (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) < new Date()) {
      return null; // expired
    }

    // Update lastUsedAt async (don't await — don't slow down the response)
    prisma.apiToken.update({
      where: { id: tokenRecord.id },
      data:  { lastUsedAt: new Date() },
    }).catch(() => {});

    return tokenRecord;
  } catch {
    return null;
  }
}
