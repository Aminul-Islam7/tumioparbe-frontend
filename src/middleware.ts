import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface JwtPayload {
    exp: number;
    is_staff?: boolean;
    [key: string]: string | number | boolean | undefined;
}

// JWT decoder that works in Edge Runtime
function parseJwt(token: string): JwtPayload | null {
    try {
        return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    } catch {
        return null;
    }
}

function tokenExpired(token: string): boolean {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
}

function isAdminUser(token: string): boolean {
    const decoded = parseJwt(token);
    return decoded?.is_staff === true;
}

export function middleware(request: NextRequest) {
    const accessToken = request.cookies.get('access_token')?.value;
    
    // Check if this is an admin route
    if (request.nextUrl.pathname.startsWith('/admin')) {
        console.log('Middleware Debug: Admin route, checking access_token:', accessToken);

        // If no token or token is expired, redirect to login
        if (!accessToken || tokenExpired(accessToken)) {
            console.log('Middleware Debug: Token missing or expired for admin route');
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Check if user is admin
        if (!isAdminUser(accessToken)) {
            console.log('Middleware Debug: User is not admin, redirecting to dashboard');
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        console.log('Middleware Debug: Admin user verified, proceeding to admin dashboard');
    }
    // Check if this is a dashboard route
    else if (request.nextUrl.pathname.startsWith('/dashboard')) {
        console.log('Middleware Debug: Dashboard route, checking access_token:', accessToken);

        // If no token or token is expired, redirect to login
        if (!accessToken || tokenExpired(accessToken)) {
            console.log('Middleware Debug: Token missing or expired');
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }

        console.log('Middleware Debug: Token valid, proceeding to dashboard');
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*'],
};
