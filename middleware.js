import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/api/admin/:path*', '/admin/:path*'],
};

export function middleware(request) {
  // Allow API routes that might use Bearer tokens instead of cookies (if any are added in the future under /api/admin)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // We rely on the actual route handlers to decode the JWT and verify the ADMIN role
  // because Next.js Edge Middleware doesn't support the 'jsonwebtoken' node module.
  return NextResponse.next();
}
