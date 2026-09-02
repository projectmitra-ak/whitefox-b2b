import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // No authentication required - allow all routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/tenant/:path*',
    '/driver/:path*',
    '/employee/:path*',
    '/dashboard/:path*',
    '/garments/:path*',
  ],
};