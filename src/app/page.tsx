'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, CheckCircle, Globe, Star, Sparkles, Heart } from 'lucide-react';
import Logo from '@/components/shared/logo';
import { isAuthenticated, isAdmin } from '@/lib/auth';

export default function Home() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Only redirect if user is logged in AND didn't explicitly navigate here
        // The "stay" parameter indicates the user intentionally wants to view the home page
        const stayOnHome = searchParams.get('stay') === 'true';
        
        if (!stayOnHome && isAuthenticated()) {
            // Redirect admin users to admin dashboard, others to regular dashboard
            if (isAdmin()) {
                router.replace('/admin/dashboard');
            } else {
                router.replace('/dashboard');
            }
        } else {
            setIsChecking(false);
        }
    }, [router, searchParams]);

    // Show nothing while checking auth (prevents flash of content before redirect)
    if (isChecking) {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1">
                {/* Hero Section - Vibrant gradient with playful colors */}
                <section className="relative overflow-hidden bg-gradient-to-br from-primary-100 via-secondary-100 to-lavender-100 dark:from-primary-900/20 dark:via-secondary-900/20 dark:to-lavender-900/20 py-20 md:py-28">
                    {/* Decorative floating shapes */}
                    <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-sunny-200/50 dark:bg-sunny-800/20 blur-xl animate-pulse" />
                    <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-primary-200/50 dark:bg-primary-800/20 blur-xl animate-pulse delay-150" />
                    <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-secondary-200/50 dark:bg-secondary-800/20 blur-xl animate-pulse delay-300" />

                    <div className="container relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sunny-100 dark:bg-sunny-900/30 text-sunny-700 dark:text-sunny-300 text-sm font-medium">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Unlock Your Creative Potential!</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-heading">
                                    A Performing and Visual Arts Platform
                                    <span className="block mt-2 bg-gradient-to-r from-primary to-lavender bg-clip-text text-transparent">
                                        Only for Kids & Teens
                                    </span>
                                </h1>
                                <p className="text-lg md:text-xl text-body-muted max-w-lg">
                                    Interactive online courses designed for students in Bangladesh.
                                    Join our learning platform and unlock your potential.
                                </p>
                                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                                    <Link href="/courses">
                                        <Button size="lg" className="w-full sm:w-auto group">
                                            Explore Courses
                                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="w-full sm:w-auto"
                                        >
                                            Register Now
                                        </Button>
                                    </Link>
                                </div>

                                {/* Trust badges */}
                                <div className="flex items-center gap-6 pt-4 text-sm text-body-muted">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 text-sunny-500 fill-sunny-500" />
                                        <span>4.9/5 Rating</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Heart className="w-4 h-4 text-primary" />
                                        <span>10k+ Students</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative h-[300px] md:h-[400px] lg:h-[500px]">
                                <Image
                                    src="/logo.png"
                                    alt="Students learning online"
                                    fill
                                    className="object-contain drop-shadow-2xl"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-16 md:py-24 bg-page-subtle dark:bg-page">
                    <div className="container">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 text-sm font-medium mb-4">
                                Why Choose Us?
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-heading">
                                Why Choose Tumio Parbe?
                            </h2>
                            <p className="text-lg text-body-muted">
                                Our platform is designed to provide the best learning experience for
                                students in Bangladesh
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Feature 1 - Sky themed */}
                            <div className="group bg-card-courses-bg border border-card-courses-border p-8 rounded-card shadow-card hover:shadow-sky transition-all duration-normal hover:-translate-y-1">
                                <div className="h-14 w-14 bg-secondary-200 dark:bg-secondary-800/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Globe className="h-7 w-7 text-secondary-600 dark:text-secondary-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-heading">
                                    Accessible Learning
                                </h3>
                                <p className="text-body-muted">
                                    Access courses from anywhere with internet connection, on any
                                    device
                                </p>
                            </div>

                            {/* Feature 2 - Lavender themed */}
                            <div className="group bg-card-assignments-bg border border-card-assignments-border p-8 rounded-card shadow-card hover:shadow-lavender transition-all duration-normal hover:-translate-y-1">
                                <div className="h-14 w-14 bg-lavender-200 dark:bg-lavender-800/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <BookOpen className="h-7 w-7 text-lavender-600 dark:text-lavender-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-heading">
                                    Quality Content
                                </h3>
                                <p className="text-body-muted">
                                    Courses designed by expert teachers following the national
                                    curriculum
                                </p>
                            </div>

                            {/* Feature 3 - Sunny themed */}
                            <div className="group bg-card-schedule-bg border border-card-schedule-border p-8 rounded-card shadow-card hover:shadow-sunny transition-all duration-normal hover:-translate-y-1">
                                <div className="h-14 w-14 bg-sunny-200 dark:bg-sunny-800/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <CheckCircle className="h-7 w-7 text-sunny-600 dark:text-sunny-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-heading">
                                    Interactive Learning
                                </h3>
                                <p className="text-body-muted">
                                    Engage with teachers and fellow students through live classes
                                    and discussions
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section - Gradient with glow */}
                <section className="relative py-20 overflow-hidden">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-dark to-lavender" />

                    {/* Decorative elements */}
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

                    <div className="container relative text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Ready to start learning?
                        </h2>
                        <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
                            Join thousands of students already learning with Tumio Parbe
                        </p>
                        <Link href="/register">
                            <Button
                                size="lg"
                                variant="secondary"
                                className="shadow-lg hover:shadow-xl"
                            >
                                Get Started Today
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-neutral-900 dark:bg-neutral-950 text-white py-12">
                    <div className="container">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <Logo size="medium" />
                                <p className="mt-4 text-neutral-400 text-sm">
                                    Empowering students across Bangladesh with quality education
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
                                <ul className="space-y-2 text-sm text-neutral-400">
                                    <li>
                                        <Link
                                            href="/courses"
                                            className="hover:text-primary-light transition-colors"
                                        >
                                            All Courses
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/about"
                                            className="hover:text-primary-light transition-colors"
                                        >
                                            About Us
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/contact"
                                            className="hover:text-primary-light transition-colors"
                                        >
                                            Contact
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-lg mb-4">Legal</h4>
                                <ul className="space-y-2 text-sm text-neutral-400">
                                    <li>
                                        <Link
                                            href="/privacy"
                                            className="hover:text-primary-light transition-colors"
                                        >
                                            Privacy Policy
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/terms"
                                            className="hover:text-primary-light transition-colors"
                                        >
                                            Terms of Service
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/refund"
                                            className="hover:text-primary-light transition-colors"
                                        >
                                            Refund Policy
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
                                <p className="text-sm text-neutral-400 mb-2">
                                    support@tumioparbe.com
                                </p>
                                <p className="text-sm text-neutral-400">+880 1XXXXXXXXX</p>
                                <div className="flex space-x-4 mt-4">
                                    <a
                                        href="https://facebook.com"
                                        target="_blank"
                                        rel="noopener"
                                        className="text-neutral-400 hover:text-primary-light transition-colors"
                                    >
                                        <span className="sr-only">Facebook</span>
                                        <svg
                                            className="h-5 w-5"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                                        </svg>
                                    </a>
                                    <a
                                        href="https://youtube.com"
                                        target="_blank"
                                        rel="noopener"
                                        className="text-neutral-400 hover:text-primary-light transition-colors"
                                    >
                                        <span className="sr-only">YouTube</span>
                                        <svg
                                            className="h-5 w-5"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-neutral-800 mt-12 pt-8 text-center text-sm text-neutral-500">
                            <p>© {new Date().getFullYear()} Tumio Parbe. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
