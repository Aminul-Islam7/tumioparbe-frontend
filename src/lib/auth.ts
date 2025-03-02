import { AuthTokens } from '@/types';

const AUTH_TOKENS_KEY = 'tumio_parbe_auth_tokens';
const USER_DATA_KEY = 'tumio_parbe_user_data';

// Token management functions
export function getAuthTokens(): AuthTokens | null {
    if (typeof window === 'undefined') return null;

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
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify(tokens));
}

export function clearAuthTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_TOKENS_KEY);
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

export function logout(): void {
    clearAuthTokens();
    clearUserData();
}

export function parseJwt(token: string): any {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
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

    return decoded.is_admin ? 'admin' : 'parent';
}
