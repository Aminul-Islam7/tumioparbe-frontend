'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function SimpleDashboardPage() {
    const { user } = useAuth(true);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Dashboard Test Page</h1>
            <p className="mb-4">If you can see this page, the routing is working correctly!</p>
            <p className="mb-4">Welcome, {user?.name || 'User'}!</p>
            <div className="mt-4">
                <Link href="/" className="text-blue-500 underline">
                    Back to home
                </Link>
            </div>
        </div>
    );
}
