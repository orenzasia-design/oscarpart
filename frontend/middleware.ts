import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================
// Route protection rules
// ============================================================

const PUBLIC_ROUTES    = ['/', '/search', '/login', '/register', '/rfq'];
const CUSTOMER_ROUTES  = ['/my-dashboard', '/history'];
const ADMIN_ROUTES     = ['/admin'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/') || pathname.startsWith(r + '?'));
}

function requiresCustomer(pathname: string): boolean {
  return CUSTOMER_ROUTES.some((r) => pathname.startsWith(r));
}

function requiresAdmin(pathname: string): boolean {
  return ADMIN_ROUTES.some((r) => pathname.startsWith(r));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets & API â€” skip
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // We use the access token stored in a cookie for SSR route protection.
  // The actual JWT verification is done on the backend â€” here we just
  // check presence and a simple role claim we store in a separate cookie.
  const accessToken = request.cookies.get('_at_role')?.value;
  const userRole    = request.cookies.get('_role')?.value || 'public';
  const userStatus  = request.cookies.get('_status')?.value || '';

  const isAuthenticated = !!accessToken;
  const isApproved      = ['approved', 'admin', 'superadmin'].includes(userRole);
  const isAdmin         = ['admin', 'superadmin'].includes(userRole);

  // Admin routes
  if (requiresAdmin(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/my-dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Customer-only routes
  if (requiresCustomer(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
    }
    return NextResponse.next();
  }

  // Already logged in â€” redirect away from login/register
  if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
    if (isAdmin) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    return NextResponse.redirect(new URL('/my-dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
