'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    Users,
    CreditCard,
    TrendingUp,
    ArrowRight,
    Loader2,
} from 'lucide-react';
import { adminApi, AdminStats } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await adminApi.getStats();
                setStats(response.data);
            } catch (err: any) {
                console.error('Error fetching stats:', err);
                // For now, use mock data if API doesn't exist
                setStats({
                    total_courses: 0,
                    active_courses: 0,
                    total_batches: 0,
                    total_students: 0,
                    total_parents: 0,
                    total_admins: 0,
                    pending_payments: 0,
                    monthly_revenue: 0,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            title: 'Active Courses',
            value: stats?.active_courses ?? 0,
            total: stats?.total_courses ?? 0,
            icon: BookOpen,
            color: 'secondary',
            href: '/admin/courses',
            description: 'Total courses in system',
        },
        {
            title: 'Total Students',
            value: stats?.total_students ?? 0,
            icon: GraduationCap,
            color: 'lavender',
            href: '/admin/students',
            description: 'Enrolled students',
        },
        {
            title: 'Users',
            value: (stats?.total_parents ?? 0) + (stats?.total_admins ?? 0),
            icon: Users,
            color: 'tangerine',
            href: '/admin/users',
            description: `${stats?.total_parents ?? 0} parents, ${stats?.total_admins ?? 0} admins`,
        },
        {
            title: 'Pending Payments',
            value: stats?.pending_payments ?? 0,
            icon: CreditCard,
            color: 'emerald',
            href: '/admin/payments',
            description: 'Awaiting payment',
        },
    ];

    const getCardColorClasses = (color: string) => {
        const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
            primary: {
                bg: 'bg-primary-50 dark:bg-primary-900/20',
                icon: 'text-primary',
                border: 'border-primary-200 dark:border-primary-800',
            },
            secondary: {
                bg: 'bg-secondary-50 dark:bg-secondary-900/20',
                icon: 'text-secondary',
                border: 'border-secondary-200 dark:border-secondary-800',
            },
            lavender: {
                bg: 'bg-lavender-50 dark:bg-lavender-900/20',
                icon: 'text-lavender-600 dark:text-lavender-400',
                border: 'border-lavender-200 dark:border-lavender-800',
            },
            tangerine: {
                bg: 'bg-tangerine-50 dark:bg-tangerine-900/20',
                icon: 'text-tangerine-600 dark:text-tangerine-400',
                border: 'border-tangerine-200 dark:border-tangerine-800',
            },
            emerald: {
                bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                icon: 'text-emerald-600 dark:text-emerald-400',
                border: 'border-emerald-200 dark:border-emerald-800',
            },
        };

        return colorMap[color] || colorMap.primary;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-lavender/10 dark:from-primary/5 dark:via-secondary/5 dark:to-lavender/5 rounded-2xl p-6 border border-primary/20 dark:border-primary/10">
                <h1 className="text-2xl font-bold text-heading mb-2">
                    Welcome to Admin Dashboard
                </h1>
                <p className="text-body-muted">
                    Manage courses, students, payments, and more from here.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => {
                    const colors = getCardColorClasses(stat.color);
                    const Icon = stat.icon;
                    
                    return (
                        <Link
                            key={stat.title}
                            href={stat.href}
                            className={cn(
                                'group bg-card rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all duration-300',
                                colors.border
                            )}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn('p-3 rounded-xl', colors.bg)}>
                                    <Icon className={cn('w-6 h-6', colors.icon)} />
                                </div>
                                <ArrowRight className="w-5 h-5 text-body-subtle opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                            </div>
                            
                            <div className="space-y-1">
                                <p className="text-3xl font-bold text-heading">
                                    {stat.value}
                                    {stat.total !== undefined && stat.total !== stat.value && (
                                        <span className="text-lg text-body-muted font-normal">
                                            /{stat.total}
                                        </span>
                                    )}
                                </p>
                                <p className="text-sm font-medium text-body-muted">
                                    {stat.title}
                                </p>
                                <p className="text-xs text-body-subtle">
                                    {stat.description}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-2xl p-6 border border-default shadow-sm">
                <h2 className="text-lg font-semibold text-heading mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <Link
                        href="/admin/courses"
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary-50 dark:bg-secondary-900/20 hover:bg-secondary-100 dark:hover:bg-secondary-900/30 transition-colors text-center group"
                    >
                        <BookOpen className="w-6 h-6 text-secondary group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-heading">Courses</span>
                    </Link>
                    
                    <Link
                        href="/admin/students"
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-lavender-50 dark:bg-lavender-900/20 hover:bg-lavender-100 dark:hover:bg-lavender-900/30 transition-colors text-center group"
                    >
                        <GraduationCap className="w-6 h-6 text-lavender-600 dark:text-lavender-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-heading">Students</span>
                    </Link>
                    
                    <Link
                        href="/admin/payments"
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-center group"
                    >
                        <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-heading">Payments</span>
                    </Link>
                    
                    <Link
                        href="/admin/users"
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-tangerine-50 dark:bg-tangerine-900/20 hover:bg-tangerine-100 dark:hover:bg-tangerine-900/30 transition-colors text-center group"
                    >
                        <Users className="w-6 h-6 text-tangerine-600 dark:text-tangerine-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-heading">Users</span>
                    </Link>
                    
                    <Link
                        href="/admin/activity"
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-center group"
                    >
                        <TrendingUp className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-heading">Activity</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
