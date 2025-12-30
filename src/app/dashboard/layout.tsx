'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    CreditCard,
    Home,
    Users,
    UserCircle,
    ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import LightDarkSwitch from '@/components/shared/light-dark-switch';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth(true);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const sidebarLinks = [
        {
            href: '/dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-5 h-5" />,
            color: 'primary',
        },
        {
            href: '/dashboard/courses',
            label: 'Courses',
            icon: <BookOpen className="w-5 h-5" />,
            color: 'secondary',
        },
        {
            href: '/dashboard/students',
            label: 'My Children',
            icon: <Users className="w-5 h-5" />,
            color: 'lavender',
        },
        {
            href: '/dashboard/payments',
            label: 'Payments',
            icon: <CreditCard className="w-5 h-5" />,
            color: 'tangerine',
        },
    ];

    const pageInfo = {
        '/dashboard': {
            title: 'Overview',
        },
        '/dashboard/profile': {
            title: 'Profile',
        },
        '/dashboard/students': {
            title: 'My Children',
        },
        '/dashboard/courses': {
            title: 'Courses',
        },
        '/dashboard/payments': {
            title: 'Payments',
        },
    };

    const currentPath = pathname as keyof typeof pageInfo;
    const currentInfo = pageInfo[currentPath] || {
        title: 'Dashboard',
    };

    const getNavColorClasses = (color: string, isActive: boolean) => {
        const colorMap: Record<string, { active: string; inactive: string }> = {
            primary: {
                active: 'bg-primary-100 dark:bg-primary-900/30 text-primary dark:text-primary-light border-l-4 border-primary',
                inactive:
                    'text-body-muted hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary border-l-4 border-transparent',
            },
            secondary: {
                active: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary dark:text-secondary-light border-l-4 border-secondary',
                inactive:
                    'text-body-muted hover:bg-secondary-50 dark:hover:bg-secondary-900/20 hover:text-secondary border-l-4 border-transparent',
            },
            lavender: {
                active: 'bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400 border-l-4 border-lavender-500',
                inactive:
                    'text-body-muted hover:bg-lavender-50 dark:hover:bg-lavender-900/20 hover:text-lavender-600 border-l-4 border-transparent',
            },
            tangerine: {
                active: 'bg-tangerine-100 dark:bg-tangerine-900/30 text-tangerine-600 dark:text-tangerine-400 border-l-4 border-tangerine-500',
                inactive:
                    'text-body-muted hover:bg-tangerine-50 dark:hover:bg-tangerine-900/20 hover:text-tangerine-600 border-l-4 border-transparent',
            },
        };

        return isActive ? colorMap[color].active : colorMap[color].inactive;
    };

    return (
        <div className="flex min-h-screen bg-page-subtle dark:bg-page">
            {/* Sidebar */}
            <aside className="w-sidebar bg-card border-r border-default flex flex-col shadow-sm">
                <div className="p-5 border-b border-default">
                    <Link href="/" className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative w-10 h-10 group-hover:scale-105 transition-transform">
                            <Image
                                src="/logo.png"
                                alt="Tumio Parbe"
                                fill
                                className="object-contain object-left"
                                priority
                            />
                        </div>
                        <span className="font-bold text-lg text-heading">তুমিও পারবে</span>
                    </Link>
                </div>

                <nav className="p-4 space-y-1 flex-1">
                    {sidebarLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-fast font-medium',
                                getNavColorClasses(link.color, pathname === link.href)
                            )}
                        >
                            {link.icon}
                            <span>{link.label}</span>
                            {pathname === link.href && (
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Home button at bottom */}
                <div className="p-4 border-t border-default">
                    <Link
                        href="/"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-body-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-fast"
                    >
                        <Home className="w-5 h-5" />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-card border-b border-default px-6 py-4 shrink-0 shadow-xs">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-2xl text-heading">
                                {currentInfo.title}
                            </h2>
                            {/* Description removed as per requirement */}
                        </div>
                        <div className="flex items-center gap-3">
                            {user && (
                                <Link
                                    href="/dashboard/profile"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-fast group"
                                >
                                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/40 transition-colors">
                                        <UserCircle className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium hidden sm:block text-heading">
                                        {user.name}
                                    </span>
                                </Link>
                            )}
                            <LightDarkSwitch />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 bg-page-subtle dark:bg-page">
                    {children}
                </main>
            </div>
        </div>
    );
}
