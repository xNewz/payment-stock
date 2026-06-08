import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { verifyBearerToken } from '@/lib/apiToken';

export async function GET(request, { params }) {
  try {
    const bearerToken = await verifyBearerToken(request);
    let payload = null;

    if (!bearerToken) {
      payload = await verifyAuth();
      if (!payload) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const { filename } = await params;
    
    // Security check to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    // Check authorization: Admin or Owner (if not accessed via Bearer Token)
    if (!bearerToken && payload.role !== 'ADMIN') {
      const payment = await prisma.payment.findFirst({
        where: { slipUrl: `/uploads/${filename}` },
        select: { userId: true },
      });
      if (!payment || payment.userId !== payload.id) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const filePath = path.join(process.cwd(), 'storage', 'uploads', filename);

    try {
      const fileBuffer = await fs.readFile(filePath);
      
      // Determine content type based on extension
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.gif') contentType = 'image/gif';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (e) {
      return new NextResponse('File not found', { status: 404 });
    }
  } catch (error) {
    console.error('Uploads endpoint error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
