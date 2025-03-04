import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, CheckCircle, Globe } from 'lucide-react';
import Navbar from '@/components/shared/navbar';
import Logo from '@/components/shared/logo';

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="bg-gradient-to-r from-bubblegum/10 to-skyblue/10 py-20 md:py-28">
                    <div className="container">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                                    A Performing and Visual Arts Platform
                                    <span className="block text-bubblegum">
                                        Only for Kids & Teens
                                    </span>
                                </h1>
                                <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                                    Interactive online courses designed for students in Bangladesh.
                                    Join our learning platform and unlock your potential.
                                </p>
                                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                                    <Link href="/courses">
                                        <Button size="lg" className="w-full sm:w-auto">
                                            Explore Courses
                                            <ArrowRight className="ml-2 h-4 w-4" />
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
                            </div>

                            <div className="relative h-[300px] md:h-[400px] lg:h-[500px]">
                                <Image
                                    src="/logo.png"
                                    alt="Students learning online"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="bg-muted/50 py-16 md:py-24">
                    <div className="container">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">
                                Why Choose Tumio Parbe?
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Our platform is designed to provide the best learning experience for
                                students in Bangladesh
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-card p-8 rounded-lg border shadow-sm hover:shadow-md transition">
                                <div className="h-12 w-12 bg-bubblegum/10 rounded-full flex items-center justify-center mb-6">
                                    <Globe className="h-6 w-6 text-bubblegum" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Accessible Learning</h3>
                                <p className="text-muted-foreground">
                                    Access courses from anywhere with internet connection, on any
                                    device
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-card p-8 rounded-lg border shadow-sm hover:shadow-md transition">
                                <div className="h-12 w-12 bg-skyblue/10 rounded-full flex items-center justify-center mb-6">
                                    <BookOpen className="h-6 w-6 text-skyblue" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Quality Content</h3>
                                <p className="text-muted-foreground">
                                    Courses designed by expert teachers following the national
                                    curriculum
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-card p-8 rounded-lg border shadow-sm hover:shadow-md transition">
                                <div className="h-12 w-12 bg-sunny/10 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle className="h-6 w-6 text-sunny" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Interactive Learning</h3>
                                <p className="text-muted-foreground">
                                    Engage with teachers and fellow students through live classes
                                    and discussions
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-bubblegum py-16">
                    <div className="container text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Ready to start learning?
                        </h2>
                        <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
                            Join thousands of students already learning with Tumio Parbe
                        </p>
                        <Link href="/register">
                            <Button size="lg" variant="secondary">
                                Get Started Today
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-900 text-white py-12">
                    <div className="container">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <Logo size="medium" />
                                <p className="mt-4 text-slate-300 text-sm">
                                    Empowering students across Bangladesh with quality education
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
                                <ul className="space-y-2 text-sm text-slate-300">
                                    <li>
                                        <Link
                                            href="/courses"
                                            className="hover:text-white transition"
                                        >
                                            All Courses
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/about" className="hover:text-white transition">
                                            About Us
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/contact"
                                            className="hover:text-white transition"
                                        >
                                            Contact
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-lg mb-4">Legal</h4>
                                <ul className="space-y-2 text-sm text-slate-300">
                                    <li>
                                        <Link
                                            href="/privacy"
                                            className="hover:text-white transition"
                                        >
                                            Privacy Policy
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/terms" className="hover:text-white transition">
                                            Terms of Service
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/refund"
                                            className="hover:text-white transition"
                                        >
                                            Refund Policy
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
                                <p className="text-sm text-slate-300 mb-2">
                                    support@tumioparbe.com
                                </p>
                                <p className="text-sm text-slate-300">+880 1XXXXXXXXX</p>
                                <div className="flex space-x-4 mt-4">
                                    <a
                                        href="https://facebook.com"
                                        target="_blank"
                                        rel="noopener"
                                        className="hover:text-bubblegum transition"
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
                                        className="hover:text-bubblegum transition"
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

                        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-slate-400">
                            <p>© {new Date().getFullYear()} Tumio Parbe. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
