import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getAuthTokens, tokenExpired } from '@/lib/auth';
import { authApi } from '@/lib/api';

export function useAuth(requireAuth = false, adminOnly = false) {
    const router = useRouter();
    const { user, isAuthenticated, isAdmin, login, logout } = useAuthStore();

    useEffect(() => {
        const checkAuth = async () => {
            const tokens = getAuthTokens();

            // If no tokens and auth is required, redirect to login
            if (!tokens && requireAuth) {
                router.push('/login');
                return;
            }

            // If tokens exist but access token expired, try to refresh
            if (tokens && tokenExpired(tokens.access)) {
                try {
                    const response = await authApi.refreshToken(tokens.refresh);
                    login(
                        {
                            ...tokens,
                            access: response.data.access,
                        },
                        user
                    );
                } catch (error) {
                    logout();
                    if (requireAuth) {
                        router.push('/login');
                    }
                }
            }

            // If admin page but user is not admin, redirect to dashboard
            if (adminOnly && !isAdmin) {
                router.push('/dashboard');
            }
        };

        checkAuth();
    }, [requireAuth, adminOnly, isAuthenticated, isAdmin, router]);

    return {
        user,
        isAuthenticated,
        isAdmin,
        login,
        logout,
    };
}
