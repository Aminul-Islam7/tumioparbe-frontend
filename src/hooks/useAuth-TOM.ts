import { useEffect } from 'react';
import { useRouter, redirect } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getAuthTokens, tokenExpired } from '@/lib/auth';

export function useAuth(requireAuth = false, adminOnly = false) {
    const router = useRouter();
    const { user, isAuthenticated, isAdmin, logout } = useAuthStore();

    useEffect(() => {
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
            if (adminOnly && !isAdmin) {
                router.push('/dashboard');
            }
        };

        checkAuth();
    }, [requireAuth, adminOnly, isAdmin, router, logout]);

    return {
        user,
        isAuthenticated,
        isAdmin,
        logout,
    };
}
