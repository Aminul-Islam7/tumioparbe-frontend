import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface JwtPayload {
    exp: number;
    [key: string]: string | number | boolean;
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

export function middleware(request: NextRequest) {
    // Check if this is a dashboard route
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        // Get auth token from cookies
        const accessToken = request.cookies.get('access_token')?.value;

        // If no token or token is expired, redirect to login
        if (!accessToken || tokenExpired(accessToken)) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/dashboard/:path*',
};
