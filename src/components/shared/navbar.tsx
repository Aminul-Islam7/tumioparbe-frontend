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

type NavColor = 'bubblegum' | 'skyblue' | 'sunny' | 'tangerine' | 'purple';

export default function Navbar({ className }: NavbarProps) {
    const pathname = usePathname();
    const { isAuthenticated } = useAuthStore();
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
        { href: '/', label: 'Home', color: 'bubblegum' },
        { href: '/courses', label: 'Courses', color: 'skyblue' },
        { href: '/Awards', label: 'Awards', color: 'sunny' },
        { href: '/about', label: 'About', color: 'purple' },
        { href: '/contact', label: 'Contact', color: 'tangerine' },
    ] satisfies Array<{ href: string; label: string; color: NavColor }>;

    const getColorClasses = (color: NavColor, isActive: boolean) => {
        const colorMap = {
            bubblegum: {
                active: 'bg-bubblegum/10 text-bubblegum hover:text-bubblegum/80',
                inactive: 'text-foreground/70 hover:bg-bubblegum/10 hover:text-bubblegum',
            },
            skyblue: {
                active: 'bg-skyblue/10 text-skyblue hover:text-skyblue/80',
                inactive: 'text-foreground/70 hover:text-skyblue',
            },
            sunny: {
                active: 'bg-sunny/10 text-sunny hover:text-sunny/80',
                inactive: 'text-foreground/70 hover:text-sunny',
            },
            tangerine: {
                active: 'bg-tangerine/10 text-tangerine hover:text-tangerine/80',
                inactive: 'text-foreground/70  hover:text-tangerine',
            },
            purple: {
                active: 'bg-purple/10 text-purple hover:text-purple/80',
                inactive: 'text-foreground/70 hover:text-purple',
            },
        };

        return cn(
            'px-4 py-2 text-base font-medium rounded-md transition-all duration-200',
            isActive ? colorMap[color].active : colorMap[color].inactive
        );
    };

    const isLinkActive = (href: string) => pathname === href;

    return (
        <header
            className={cn(
                'sticky top-0 z-40 w-full border-b transition-all duration-200',
                hasScrolled
                    ? 'bg-background/98 backdrop-blur supports-[backdrop-filter]:bg-background/98'
                    : 'bg-background',
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
                        <nav className="flex items-center space-x-6">
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
                    <div className="hidden md:flex items-center space-x-4">
                        <LightDarkSwitch />
                        {isAuthenticated ? (
                            <Link href="/dashboard">
                                <Button variant="default" size="sm" className="">
                                    Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link href="/login">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-tp_red hover:text-tp_red hover:bg-tp_red/10 dark:text-bubblegum dark:hover:bg-bubblegum/10"
                                    >
                                        Log In
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button variant="default" size="sm" className="">
                                        Register
                                    </Button>
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
                    {/* Overlay with opacity effect - using a div instead of motion.div */}
                    <div
                        ref={overlayRef}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        style={{
                            opacity: 1,
                            transition: 'opacity 0.3s ease',
                        }}
                    />

                    {/* Content scaling container - using a simple div */}
                    <div
                        className="fixed inset-0 z-30 pointer-events-none overflow-hidden md:hidden"
                        style={{
                            transform: 'scale(0.95)',
                            borderRadius: '1rem',
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
                        className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-background border-t rounded-t-xl shadow-lg"
                        style={{
                            transform: 'translateY(100%)', // Initial state for animation
                            willChange: 'transform',
                        }}
                    >
                        {/* Handle bar indicator */}
                        <div className="w-full flex justify-center py-3">
                            <div className="w-12 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {/* Navigation links */}
                        <div className="max-h-[70vh] overflow-y-auto px-4 pb-8 space-y-3 flex flex-col items-center">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        getColorClasses(link.color, isLinkActive(link.href)),
                                        'flex justify-center w-full text-center'
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="pt-3 w-full space-y-3">
                                {isAuthenticated ? (
                                    <Link href="/dashboard" className="block">
                                        <Button
                                            variant="default"
                                            className="w-full hover:text-white transition-all duration-200"
                                        >
                                            Dashboard
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="/login" className="block">
                                            <Button
                                                variant="outline"
                                                className="w-full hover:text-skyblue transition-all duration-200"
                                            >
                                                Log In
                                            </Button>
                                        </Link>
                                        <Link href="/register" className="block">
                                            <Button
                                                variant="default"
                                                className="w-full hover:text-white transition-all duration-200"
                                            >
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
