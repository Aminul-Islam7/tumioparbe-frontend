'use client';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
    const { user } = useAuth(true);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Welcome, {user?.name || 'Back'}!</h1>
                <p className="text-muted-foreground mt-2">
                    This is your dashboard where you can manage your courses and account.
                </p>
            </div>

            {/* Add dashboard content and stats here */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-6 bg-background rounded-lg shadow-sm border">
                    <h3 className="font-semibold mb-2">My Courses</h3>
                    <p className="text-3xl font-bold">0</p>
                </div>

                <div className="p-6 bg-background rounded-lg shadow-sm border">
                    <h3 className="font-semibold mb-2">Completed Lessons</h3>
                    <p className="text-3xl font-bold">0</p>
                </div>

                <div className="p-6 bg-background rounded-lg shadow-sm border">
                    <h3 className="font-semibold mb-2">Active Enrollments</h3>
                    <p className="text-3xl font-bold">0</p>
                </div>
            </div>
        </div>
    );
}
