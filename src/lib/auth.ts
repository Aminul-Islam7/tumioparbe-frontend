import { AuthTokens } from '@/types';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

const AUTH_TOKENS_KEY = 'tumio_parbe_auth_tokens';
const USER_DATA_KEY = 'tumio_parbe_user_data';

// Token management functions
export function getAuthTokens(): AuthTokens | null {
    if (typeof window === 'undefined') {
        // Server-side: try to get from cookie
        const accessToken = getCookie('access_token');
        const refreshToken = getCookie('refresh_token');
        if (accessToken && refreshToken) {
            return { access: accessToken.toString(), refresh: refreshToken.toString() };
        }
        return null;
    }

    // Client-side: try localStorage first
    const tokensStr = localStorage.getItem(AUTH_TOKENS_KEY);
    if (!tokensStr) return null;

    try {
        return JSON.parse(tokensStr) as AuthTokens;
    } catch (e) {
        console.error('Failed to parse auth tokens', e);
        return null;
    }
}

export function setAuthTokens(tokens: AuthTokens): void {
    // Set in localStorage for client-side
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify(tokens));
    }
    // Set in cookies for middleware/server-side and client-side
    const cookieOptions = {
        maxAge: 60 * 60 * 24, // 24 hours for access_token
        path: '/',
        sameSite: 'lax' as const,
        // secure only in production
        secure: process.env.NODE_ENV === 'production',
    };

    // access token
    setCookie('access_token', tokens.access, cookieOptions);

    // refresh token (longer expiration)
    setCookie('refresh_token', tokens.refresh, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30,
    });

    // Fallback: ensure cookie is also set via document.cookie immediately on client
    if (typeof window !== 'undefined') {
        try {
            // access_token
            document.cookie = `access_token=${encodeURIComponent(tokens.access)}; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
            // refresh_token
            document.cookie = `refresh_token=${encodeURIComponent(tokens.refresh)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
        } catch (e) {
            // ignore fallback failures
            // cookies-next should have succeeded but this ensures immediate availability in strange environments
            // eslint-disable-next-line no-console
            console.warn('cookie fallback failed', e);
        }
    }
}

export function clearAuthTokens(): void {
    // Clear from localStorage
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKENS_KEY);
    }

    // Clear cookies
    deleteCookie('access_token');
    deleteCookie('refresh_token');
}

// User data management
export function getUserData<T>(): T | null {
    if (typeof window === 'undefined') return null;

    const userDataStr = localStorage.getItem(USER_DATA_KEY);
    if (!userDataStr) return null;

    try {
        return JSON.parse(userDataStr) as T;
    } catch (e) {
        console.error('Failed to parse user data', e);
        return null;
    }
}

export function setUserData<T>(data: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
}

export function clearUserData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_DATA_KEY);
}

// Combined auth functions
export function isAuthenticated(): boolean {
    return !!getAuthTokens();
}

export function isAdmin(): boolean {
    const tokens = getAuthTokens();
    if (!tokens?.access) return false;
    
    const decoded = parseJwt(tokens.access);
    // Check for is_staff which is what Django uses for admin users
    return decoded?.is_staff === true || decoded?.is_admin === true;
}

export function logout(): void {
    clearAuthTokens();
    clearUserData();
}

interface JwtPayload {
    exp: number;
    is_admin?: boolean;
    is_staff?: boolean;
    [key: string]: any;
}

export function parseJwt(token: string): JwtPayload | null {
    try {
        return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    } catch {
        return null;
    }
}

export function tokenExpired(token?: string): boolean {
    if (!token) return true;

    const decoded = parseJwt(token);
    if (!decoded) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
}

export function getRoleFromToken(token?: string): 'admin' | 'parent' | null {
    if (!token) return null;

    const decoded = parseJwt(token);
    if (!decoded) return null;

    return decoded.is_admin || decoded.is_staff ? 'admin' : 'parent';
}
