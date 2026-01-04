import { useEffect, useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getAuthTokens, tokenExpired, isAdmin as checkIsAdminFromToken } from '@/lib/auth';

export function useAuth(requireAuth = false, adminOnly = false) {
    const router = useRouter();
    const { user, isAuthenticated, isAdmin, logout, updateUser } = useAuthStore();
    const [isHydrated, setIsHydrated] = useState(false);

    // Wait for store hydration
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        // Don't run until hydration is complete
        if (!isHydrated) return;

        const checkAuth = async () => {
            const tokens = getAuthTokens();

            // If no tokens and auth is required, redirect to login
            if (!tokens && requireAuth) {
                redirect('/login');
                return;
            }

            // If tokens exist but access token expired, logout and redirect
            if (tokens && tokenExpired(tokens.access)) {
                logout();
                if (requireAuth) {
                    redirect('/login');
                }
                return;
            }

            // If admin page but user is not admin, redirect to dashboard
            // Check directly from token to avoid race condition with store hydration
            if (adminOnly && tokens) {
                const isTokenAdmin = checkIsAdminFromToken();
                if (!isTokenAdmin) {
                    router.push('/dashboard');
                }
            }
        };

        checkAuth();
    }, [requireAuth, adminOnly, isHydrated, router, logout]);

    return {
        user,
        isAuthenticated,
        isAdmin,
        logout,
        updateUser,
    };
}
