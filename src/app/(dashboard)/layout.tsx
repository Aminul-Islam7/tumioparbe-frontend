'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BarChart3,
    BookOpen,
    CreditCard,
    Home,
    LayoutDashboard,
    LogOut,
    Menu,
    User,
    Users,
    X,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import Logo from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import LightDarkSwitch from '@/components/shared/light-dark-switch';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarLink {
    href: string;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuth(true); // Require authentication for all dashboard routes

    const sidebarLinks: SidebarLink[] = [
        { href: '/dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
        { href: '/dashboard/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
        { href: '/dashboard/courses', label: 'My Courses', icon: <BookOpen className="w-5 h-5" /> },
        {
            href: '/dashboard/payments',
            label: 'Payments',
            icon: <CreditCard className="w-5 h-5" />,
        },
        {
            href: '/dashboard/analytics',
            label: 'Analytics',
            icon: <BarChart3 className="w-5 h-5" />,
            adminOnly: true,
        },
        {
            href: '/dashboard/users',
            label: 'Users',
            icon: <Users className="w-5 h-5" />,
            adminOnly: true,
        },
    ];

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:relative',
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                        <Logo size="small" />
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {sidebarLinks
                            .filter((link) => !link.adminOnly || user?.is_admin)
                            .map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        'flex items-center space-x-3 px-3 py-2 rounded-md transition-colors',
                                        pathname === link.href
                                            ? 'bg-muted text-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )}
                                >
                                    {link.icon}
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                    </nav>

                    <div className="p-4 border-t">
                        <button
                            onClick={logout}
                            className="flex items-center space-x-3 w-full px-3 py-2 text-muted-foreground rounded-md hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
                <header className="bg-background border-b sticky top-0 z-30">
                    <div className="container flex h-16 items-center justify-between">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="md:hidden p-2 hover:bg-muted rounded-md"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div />
                        <div className="flex items-center gap-4">
                            <LightDarkSwitch />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="relative">
                                        <User className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/profile">Profile</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <div className="bg-muted/30 min-h-[calc(100vh-4rem)]">
                    <div className="container py-8">{children}</div>
                </div>
            </div>
        </div>
    );
}
