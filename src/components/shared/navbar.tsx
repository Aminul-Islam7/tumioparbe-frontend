'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Logo from '@/components/shared/logo';
import LightDarkSwitch from '@/components/shared/light-dark-switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface NavbarProps {
    className?: string;
}

type NavColor = 'primary' | 'secondary' | 'sunny' | 'tangerine' | 'lavender';

export default function Navbar({ className }: NavbarProps) {
    const pathname = usePathname();
    const { isAuthenticated, isAdmin } = useAuthStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const startYRef = useRef(0);
    const currentYRef = useRef(0);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Handle scroll events
    useEffect(() => {
        const handleScroll = () => {
            setHasScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    // Prevent body scrolling when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    // Simple touch handler with minimal overhead
    useEffect(() => {
        if (!isMenuOpen) return;

        const menu = menuRef.current;
        const overlay = overlayRef.current;
        if (!menu) return;

        const handleTouchStart = (e: TouchEvent) => {
            isDraggingRef.current = true;
            startYRef.current = e.touches[0].clientY;
            currentYRef.current = startYRef.current;

            // Reset any transitions
            if (menu) {
                menu.style.transition = 'none';
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDraggingRef.current) return;

            currentYRef.current = e.touches[0].clientY;
            const deltaY = currentYRef.current - startYRef.current;

            // Only move if dragging downward
            if (deltaY > 0 && menu) {
                menu.style.transform = `translateY(${deltaY}px)`;

                // Fade overlay as menu is dragged down
                if (overlay) {
                    const opacity = Math.max(0, 1 - deltaY / 300);
                    overlay.style.opacity = opacity.toString();
                }
            }
        };

        const handleTouchEnd = () => {
            if (!isDraggingRef.current) return;

            isDraggingRef.current = false;
            const deltaY = currentYRef.current - startYRef.current;

            if (menu) {
                menu.style.transition = 'all 0.3s ease';

                // If dragged far enough down, close the menu
                if (deltaY > 80) {
                    menu.style.transform = `translateY(${window.innerHeight}px)`;

                    // Fade out overlay
                    if (overlay) {
                        overlay.style.transition = 'opacity 0.3s ease';
                        overlay.style.opacity = '0';
                    }

                    // Delay state change until animation completes
                    setTimeout(() => {
                        setIsMenuOpen(false);
                    }, 300);
                } else {
                    // Reset position
                    menu.style.transform = '';

                    // Reset overlay
                    if (overlay) {
                        overlay.style.transition = 'opacity 0.3s ease';
                        overlay.style.opacity = '1';
                    }
                }
            }
        };

        // Handle click on overlay to close
        const handleOverlayClick = () => {
            if (menu) {
                menu.style.transition = 'all 0.3s ease';
                menu.style.transform = `translateY(${window.innerHeight}px)`;

                // Fade out overlay
                if (overlay) {
                    overlay.style.transition = 'opacity 0.3s ease';
                    overlay.style.opacity = '0';
                }

                setTimeout(() => {
                    setIsMenuOpen(false);
                }, 300);
            }
        };

        // Add event listeners to the menu
        menu.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        // Add click handler to overlay
        if (overlay) {
            overlay.addEventListener('click', handleOverlayClick);
        }

        return () => {
            // Clean up all event listeners
            menu.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);

            if (overlay) {
                overlay.removeEventListener('click', handleOverlayClick);
            }
        };
    }, [isMenuOpen]);

    // Effect to handle entrance animation
    useEffect(() => {
        if (isMenuOpen && menuRef.current) {
            const menu = menuRef.current;

            // Set initial position for entrance animation
            menu.style.transform = 'translateY(100%)';
            menu.style.transition = 'transform 0.3s ease-out';

            // Trigger the animation in the next frame
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    menu.style.transform = 'translateY(0)';
                });
            });
        }
    }, [isMenuOpen]);

    const navLinks = [
        { href: '/?stay=true', label: 'Home', color: 'primary' },
        { href: '/courses', label: 'Courses', color: 'secondary' },
        { href: '/Awards', label: 'Awards', color: 'sunny' },
        { href: '/about', label: 'About', color: 'lavender' },
        { href: '/contact', label: 'Contact', color: 'tangerine' },
    ] satisfies Array<{ href: string; label: string; color: NavColor }>;

    const getColorClasses = (color: NavColor, isActive: boolean) => {
        const colorMap = {
            primary: {
                active: 'bg-primary-100 dark:bg-primary-900/30 text-primary dark:text-primary-light',
                inactive:
                    'text-body-muted hover:bg-primary-100 dark:hover:bg-primary-900/20 hover:text-primary',
            },
            secondary: {
                active: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary dark:text-secondary-light',
                inactive:
                    'text-body-muted hover:bg-secondary-100 dark:hover:bg-secondary-900/20 hover:text-secondary',
            },
            sunny: {
                active: 'bg-sunny-100 dark:bg-sunny-900/30 text-sunny-600 dark:text-sunny-400',
                inactive:
                    'text-body-muted hover:bg-sunny-100 dark:hover:bg-sunny-900/20 hover:text-sunny-600',
            },
            tangerine: {
                active: 'bg-tangerine-100 dark:bg-tangerine-900/30 text-tangerine-600 dark:text-tangerine-400',
                inactive:
                    'text-body-muted hover:bg-tangerine-100 dark:hover:bg-tangerine-900/20 hover:text-tangerine-600',
            },
            lavender: {
                active: 'bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400',
                inactive:
                    'text-body-muted hover:bg-lavender-100 dark:hover:bg-lavender-900/20 hover:text-lavender-600',
            },
        };

        return cn(
            'px-4 py-2 text-base font-medium rounded-xl transition-all duration-fast',
            isActive ? colorMap[color].active : colorMap[color].inactive
        );
    };

    const isLinkActive = (href: string) => {
        // For home page, check if pathname is / (regardless of query params)
        if (href === '/?stay=true') {
            return pathname === '/';
        }
        return pathname === href;
    };

    // Hide navbar on dashboard and admin routes
    if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) {
        return null;
    }

    // Determine dashboard path based on user role
    const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';

    return (
        <header
            className={cn(
                'sticky top-0 z-navbar w-full border-b transition-all duration-normal',
                hasScrolled
                    ? 'bg-page/95 backdrop-blur-lg supports-[backdrop-filter]:bg-page/80 shadow-sm'
                    : 'bg-page',
                className
            )}
        >
            <div className="container py-4">
                <div className="flex h-14 items-center justify-between">
                    {/* Logo on the left */}
                    <div className="flex items-center justify-center">
                        <Logo size="medium" />
                    </div>

                    {/* Desktop Navigation - Centered */}
                    <div className="hidden md:flex flex-1 items-center justify-center">
                        <nav className="flex items-center space-x-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={getColorClasses(link.color, isLinkActive(link.href))}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Right side items */}
                    <div className="hidden md:flex items-center space-x-3">
                        <LightDarkSwitch />
                        {isAuthenticated ? (
                            <Link href={dashboardPath}>
                                <Button size="sm">{isAdmin ? 'Admin Panel' : 'Dashboard'}</Button>
                            </Link>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link href="/login">
                                    <Button variant="ghost" size="sm">
                                        Log In
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="sm">Register</Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Navigation Button */}
                    <div className="flex items-center space-x-2 md:hidden">
                        <LightDarkSwitch />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu with Overlay */}
            {isMenuOpen && (
                <>
                    {/* Overlay with opacity effect */}
                    <div
                        ref={overlayRef}
                        className="fixed inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm z-modal-backdrop md:hidden"
                        style={{
                            opacity: 1,
                            transition: 'opacity 0.3s ease',
                        }}
                    />

                    {/* Content scaling container */}
                    <div
                        className="fixed inset-0 z-raised pointer-events-none overflow-hidden md:hidden"
                        style={{
                            transform: 'scale(0.95)',
                            borderRadius: '1.5rem',
                            top: '0.5rem',
                            left: '0.5rem',
                            right: '0.5rem',
                            bottom: '0.5rem',
                            transition: 'all 0.3s ease',
                        }}
                    />

                    {/* Mobile navigation menu */}
                    <div
                        ref={menuRef}
                        className="fixed inset-x-0 bottom-0 z-modal md:hidden bg-card border-t rounded-t-3xl shadow-2xl"
                        style={{
                            transform: 'translateY(100%)',
                            willChange: 'transform',
                        }}
                    >
                        {/* Handle bar indicator */}
                        <div className="w-full flex justify-center py-4">
                            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
                        </div>

                        {/* Navigation links */}
                        <div className="max-h-[70vh] overflow-y-auto px-6 pb-8 space-y-2 flex flex-col items-center">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        getColorClasses(link.color, isLinkActive(link.href)),
                                        'flex justify-center w-full text-center py-3'
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="pt-4 w-full space-y-3">
                                {isAuthenticated ? (
                                    <Link href={dashboardPath} className="block">
                                        <Button className="w-full" size="lg">
                                            {isAdmin ? 'Admin Panel' : 'Dashboard'}
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="/login" className="block">
                                            <Button variant="outline" className="w-full" size="lg">
                                                Log In
                                            </Button>
                                        </Link>
                                        <Link href="/register" className="block">
                                            <Button className="w-full" size="lg">
                                                Register
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </header>
    );
}
