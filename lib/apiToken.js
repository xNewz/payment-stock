import prisma from '@/lib/prisma';

/**
 * Verify a Bearer API token from the Authorization header.
 * Also updates lastUsedAt on valid use.
 *
 * @param {Request} request - Next.js Request object
 * @returns {object|null} token record or null if invalid/expired
 */
export async function verifyBearerToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;

  const rawToken = authHeader.slice(7).trim();
  if (!rawToken) return null;

  try {
    const tokenRecord = await prisma.apiToken.findUnique({
      where: { token: rawToken },
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
