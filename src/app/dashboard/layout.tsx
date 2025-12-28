'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, BookOpen, CreditCard, LogOut, Home } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth(true);
    const pathname = usePathname();

    const sidebarLinks = [
        { href: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
        { href: '/dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
        { href: '/dashboard/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
        { href: '/dashboard/courses', label: 'My Courses', icon: <BookOpen className="w-5 h-5" /> },
        {
            href: '/dashboard/payments',
            label: 'Payments',
            icon: <CreditCard className="w-5 h-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                            <Image 
                                src="/logo.png" 
                                alt="Tumio Parbe" 
                                fill 
                                className="object-contain object-left"
                                priority
                            />
                        </div>
                        <span className="font-bold text-lg">তুমিও পারবে</span>
                    </div>
                </div>

                <nav className="p-4 space-y-1">
                    {sidebarLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
                                pathname === link.href
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            )}
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </Link>
                    ))}

                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1">
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex justify-between items-center">
                        <h2 className="font-semibold">Dashboard</h2>
                        {user && (
                            <div className="text-sm">
                                Logged in as <span className="font-medium">{user.name}</span>
                            </div>
                        )}
                    </div>
                </header>

                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
