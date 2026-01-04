'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    CreditCard,
    Users,
    UserCircle,
    ChevronRight,
    Menu,
    X,
    Home,
    Settings,
    Ticket,
    Receipt,
    FileText,
    Activity,
    GraduationCap,
    UserCog,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import LightDarkSwitch from '@/components/shared/light-dark-switch';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isAdmin } = useAuth(true, true);
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const sidebarRef = useRef<HTMLElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLElement>(null);

    // Redirect non-admin users
    useEffect(() => {
        if (user && !isAdmin) {
            router.push('/dashboard');
        }
    }, [user, isAdmin, router]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [pathname]);

    // Prevent body scrolling when mobile sidebar is open
    useEffect(() => {
        if (isMobileSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileSidebarOpen]);

    // Handle scroll for smart header (mobile only)
    const handleScroll = useCallback(() => {
        if (!mainRef.current) return;
        
        const currentScrollY = mainRef.current.scrollTop;
        const isDesktop = window.innerWidth >= 1024; // lg breakpoint
        
        // Always show header on desktop
        if (isDesktop) {
            setIsHeaderVisible(true);
            return;
        }
        
        // Show header when scrolling down (any position), hide when scrolling up
        if (currentScrollY > lastScrollY && currentScrollY > 60) {
            // Scrolling up (content moving down) - hide header
            setIsHeaderVisible(false);
        } else {
            // Scrolling down (content moving up) - show header
            setIsHeaderVisible(true);
        }
        
        setLastScrollY(currentScrollY);
    }, [lastScrollY]);

    useEffect(() => {
        const mainElement = mainRef.current;
        if (mainElement) {
            mainElement.addEventListener('scroll', handleScroll, { passive: true });
            return () => mainElement.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    const closeMobileSidebar = () => {
        setIsMobileSidebarOpen(false);
    };

    // All sidebar links for admin
    const sidebarLinks = [
        {
            href: '/admin/dashboard',
            label: 'Overview',
            icon: LayoutDashboard,
            color: 'primary',
        },
        {
            href: '/admin/courses',
            label: 'Courses',
            icon: BookOpen,
            color: 'secondary',
        },
        {
            href: '/admin/students',
            label: 'Students',
            icon: GraduationCap,
            color: 'lavender',
        },
        {
            href: '/admin/users',
            label: 'Users',
            icon: UserCog,
            color: 'tangerine',
        },
        {
            href: '/admin/payments',
            label: 'Payments',
            icon: CreditCard,
            color: 'emerald',
        },
        {
            href: '/admin/coupons',
            label: 'Coupons',
            icon: Ticket,
            color: 'sunny',
        },
        {
            href: '/admin/enrollments',
            label: 'Enrollments',
            icon: FileText,
            color: 'primary',
        },
        {
            href: '/admin/invoices',
            label: 'Invoices',
            icon: Receipt,
            color: 'secondary',
        },
        {
            href: '/admin/activity',
            label: 'Activity Log',
            icon: Activity,
            color: 'lavender',
        },
    ];

    // Bottom nav links - limited set for mobile
    const bottomNavLinks = [
        {
            href: '/admin/dashboard',
            label: 'Overview',
            icon: LayoutDashboard,
            color: 'primary',
        },
        {
            href: '/admin/courses',
            label: 'Courses',
            icon: BookOpen,
            color: 'secondary',
        },
        {
            href: '/admin/students',
            label: 'Students',
            icon: GraduationCap,
            color: 'lavender',
        },
        {
            href: '/admin/payments',
            label: 'Payments',
            icon: CreditCard,
            color: 'emerald',
        },
        {
            href: '/admin/coupons',
            label: 'Coupons',
            icon: Ticket,
            color: 'sunny',
        },
    ];

    const pageInfo: Record<string, { title: string }> = {
        '/admin/dashboard': { title: 'Overview' },
        '/admin/courses': { title: 'Course Management' },
        '/admin/students': { title: 'Students' },
        '/admin/users': { title: 'Users' },
        '/admin/payments': { title: 'Payment History' },
        '/admin/coupons': { title: 'Coupon Management' },
        '/admin/enrollments': { title: 'Enrollments' },
        '/admin/invoices': { title: 'Invoices' },
        '/admin/activity': { title: 'Activity Log' },
    };

    // Get page info, handle dynamic routes
    const getPageInfo = () => {
        // Exact match first
        if (pageInfo[pathname]) {
            return pageInfo[pathname];
        }
        // Check for parent routes (for dynamic routes like /admin/courses/[id])
        for (const basePath of Object.keys(pageInfo)) {
            if (pathname.startsWith(basePath + '/')) {
                return pageInfo[basePath];
            }
        }
        return { title: 'Admin Dashboard' };
    };

    const currentInfo = getPageInfo();

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
            emerald: {
                active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500',
                inactive:
                    'text-body-muted hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 border-l-4 border-transparent',
            },
            sunny: {
                active: 'bg-sunny-100 dark:bg-sunny-900/30 text-sunny-600 dark:text-sunny-400 border-l-4 border-sunny-500',
                inactive:
                    'text-body-muted hover:bg-sunny-50 dark:hover:bg-sunny-900/20 hover:text-sunny-600 border-l-4 border-transparent',
            },
        };

        return isActive ? colorMap[color]?.active || colorMap.primary.active : colorMap[color]?.inactive || colorMap.primary.inactive;
    };

    // Bottom nav colors - matching sidebar but without borders
    const getBottomNavColorClasses = (color: string, isActive: boolean) => {
        const colorMap: Record<string, { active: string; inactive: string }> = {
            primary: {
                active: 'bg-primary-100 dark:bg-primary-900/30 text-primary dark:text-primary-light',
                inactive: 'text-body-muted',
            },
            secondary: {
                active: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary dark:text-secondary-light',
                inactive: 'text-body-muted',
            },
            lavender: {
                active: 'bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400',
                inactive: 'text-body-muted',
            },
            tangerine: {
                active: 'bg-tangerine-100 dark:bg-tangerine-900/30 text-tangerine-600 dark:text-tangerine-400',
                inactive: 'text-body-muted',
            },
            emerald: {
                active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                inactive: 'text-body-muted',
            },
            sunny: {
                active: 'bg-sunny-100 dark:bg-sunny-900/30 text-sunny-600 dark:text-sunny-400',
                inactive: 'text-body-muted',
            },
        };

        return isActive ? colorMap[color]?.active || colorMap.primary.active : colorMap[color]?.inactive || colorMap.primary.inactive;
    };

    // Check if a path is active (exact match or child route)
    const isPathActive = (href: string) => {
        if (href === '/admin/dashboard') {
            return pathname === '/admin/dashboard';
        }
        return pathname === href || pathname.startsWith(href + '/');
    };

    // Sidebar content (shared between desktop and mobile)
    const SidebarContent = () => (
        <>
            <div className="py-[14px] px-4 border-b border-default">
                <Link href="/admin/dashboard" className="flex items-center gap-3 cursor-pointer group" onClick={closeMobileSidebar}>
                    <div className="relative w-10 h-10 group-hover:scale-105 transition-transform shrink-0">
                        <Image
                            src="/logo.png"
                            alt="Tumio Parbe"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base text-heading leading-tight">তুমিও পারবে</span>
                        <span className="text-xs text-primary font-medium">Admin Panel</span>
                    </div>
                </Link>
            </div>

            <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                {sidebarLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMobileSidebar}
                        className={cn(
                            'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-fast font-medium',
                            getNavColorClasses(link.color, isPathActive(link.href))
                        )}
                    >
                        <link.icon className="w-5 h-5" />
                        <span>{link.label}</span>
                        {isPathActive(link.href) && (
                            <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                    </Link>
                ))}
            </nav>

            {/* Home button at bottom */}
            <div className="p-4 border-t border-default">
                <Link
                    href="/?stay=true"
                    onClick={closeMobileSidebar}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-body-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-fast"
                >
                    <Home className="w-5 h-5" />
                    <span>Back to Home</span>
                </Link>
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen bg-page-subtle dark:bg-page">
            {/* Desktop Sidebar - hidden on mobile */}
            <aside className="hidden lg:flex w-sidebar bg-card border-r border-default flex-col shadow-sm">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div
                    ref={overlayRef}
                    className="fixed inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm z-modal-backdrop lg:hidden"
                    onClick={closeMobileSidebar}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                ref={sidebarRef}
                className={cn(
                    'fixed inset-y-0 left-0 z-modal w-72 bg-card border-r border-default flex flex-col shadow-xl lg:hidden transition-transform duration-300 ease-out',
                    isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Close button for mobile sidebar */}
                <button
                    onClick={closeMobileSidebar}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    aria-label="Close sidebar"
                >
                    <X className="w-5 h-5 text-body-muted" />
                </button>
                <SidebarContent />
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header - fixed on mobile for smart scroll behavior */}
                <header 
                    className={cn(
                        'bg-card border-b border-default px-4 sm:px-6 py-3 sm:py-4 shadow-md transition-transform duration-300 ease-out z-header',
                        // Fixed on mobile, normal flow on desktop
                        'lg:relative lg:shrink-0 fixed top-0 left-0 right-0',
                        // Rounded corners on mobile only
                        'lg:rounded-none rounded-b-2xl',
                        // Hide/show based on scroll on mobile
                        !isHeaderVisible && 'lg:translate-y-0 -translate-y-full'
                    )}
                >
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* Left side: Logo (mobile) / Page Title */}
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            {/* Logo - mobile only (icon without text) */}
                            <Link href="/admin/dashboard" className="lg:hidden shrink-0">
                                <div className="relative w-8 h-8 hover:scale-105 transition-transform">
                                    <Image
                                        src="/logo.png"
                                        alt="Tumio Parbe"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </Link>

                            {/* Page Title */}
                            <h2 className="font-bold text-lg sm:text-xl lg:text-2xl text-heading truncate">
                                {currentInfo.title}
                            </h2>
                        </div>

                        {/* Right side: Profile + Theme Toggle + Hamburger (mobile) */}
                        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                            {/* Profile Link */}
                            {user && (
                                <Link
                                    href="/dashboard/profile"
                                    className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl hover:bg-primary/10 transition-all duration-fast group"
                                    title="Profile Settings"
                                >
                                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/40 transition-colors">
                                        <UserCircle className="h-5 w-5 text-primary" />
                                    </div>
                                    {/* User name - hidden on smaller screens */}
                                    <span className="text-sm font-medium hidden md:block text-heading max-w-[120px] truncate">
                                        {user.name}
                                    </span>
                                </Link>
                            )}

                            {/* Theme Toggle */}
                            <LightDarkSwitch />

                            {/* Hamburger Menu - mobile only, now on the right for easier thumb access */}
                            <button
                                onClick={toggleMobileSidebar}
                                className="lg:hidden p-2 rounded-xl hover:bg-primary/10 transition-colors"
                                aria-label="Open navigation menu"
                            >
                                <Menu className="w-6 h-6 text-heading" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area - add top padding on mobile for fixed header, bottom padding for bottom nav */}
                <main 
                    ref={mainRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 pt-20 sm:pt-24 lg:pt-6 pb-20 lg:pb-6 bg-page-subtle dark:bg-page"
                >
                    {children}
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-default shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-sticky rounded-t-2xl overflow-hidden">
                    <div className="flex items-stretch">
                        {bottomNavLinks.map((link) => {
                            const isActive = isPathActive(link.href);
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        'flex-1 flex flex-col items-center justify-center py-2.5 transition-colors',
                                        getBottomNavColorClasses(link.color, isActive)
                                    )}
                                >
                                    <Icon
                                        className="w-6 h-6"
                                        strokeWidth={isActive ? 2.5 : 1.5}
                                    />
                                    <span className="text-xs font-medium mt-0.5">
                                        {link.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                    {/* Safe area for phones with home indicator */}
                    <div className="h-safe-area-inset-bottom bg-card" />
                </nav>
            </div>
        </div>
    );
}
