import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthTokens } from '@/types';
import { setAuthTokens, clearAuthTokens, setUserData, clearUserData } from '@/lib/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    tokens: AuthTokens | null;
    login: (tokens: AuthTokens, user: User) => void;
    updateUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            tokens: null,
            login: (tokens: AuthTokens, user: User) => {
                setAuthTokens(tokens);
                setUserData(user);
                set({
                    user,
                    tokens,
                    isAuthenticated: true,
                    isAdmin: user.is_admin,
                });
            },
            updateUser: (user: User) => {
                setUserData(user);
                set({
                    user,
                    isAdmin: user.is_admin,
                });
            },
            logout: () => {
                clearAuthTokens();
                clearUserData();
                set({
                    user: null,
                    tokens: null,
                    isAuthenticated: false,
                    isAdmin: false,
                });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
