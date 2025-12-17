import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Static files and Next.js internal routes bypass
  if (/^\/(_next|static|.*\.(css|js|ico|png|jpg|svg|woff2?))$/.test(pathname)) {
    return NextResponse.next();
  }

  const publicRoutes = ['/', '/forgot-password'];

  try {
    // Get the token and user info from cookies
    const token = req.cookies.get('token');
    const _r = req.cookies.get('_r');
    const userCookie = req.cookies.get('user');
    let role = null;
    console.log("role", userCookie);

    if (userCookie && userCookie.value) {
      try {
        const user = JSON.parse(userCookie.value);
        role = user.role;
      } catch {
        role = null;
      }
    }

    if (!token || !_r || !userCookie) {
      // Allow access to public routes for unauthenticated users
      if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Redirect authenticated users away from public routes
    if (token && publicRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Only allow admins to access /authors
    console.log('User role:', role);
    if (pathname.startsWith('/authors') && role !== 'admin' && role !== 'employee') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    if (pathname.startsWith('/employees') && role !== 'admin' && role !== 'employee') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Allow authenticated users access to all other routes
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // Redirect to a safe route if an error occurs
    return NextResponse.redirect(new URL('/', req.url));
  }
}

export const config = {
  matcher: ['/:path*'], 
};