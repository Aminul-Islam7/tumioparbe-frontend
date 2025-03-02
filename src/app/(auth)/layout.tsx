import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import Logo from '@/components/shared/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex">
            {/* Left panel - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-bubblegum to-skyblue items-center justify-center p-12 relative">
                <div className="absolute top-4 left-4">
                    <Logo size="large" />
                </div>
                <div className="w-full max-w-md">
                    <h1 className="text-4xl font-bold text-white mb-6">
                        Start Your Learning Journey Today
                    </h1>
                    <p className="text-white/90 text-xl mb-8">
                        Join our online learning platform and unlock your child's potential with
                        engaging courses and expert teachers.
                    </p>
                    <Image
                        src="/images/auth-illustration.svg"
                        alt="Learning Illustration"
                        width={400}
                        height={300}
                        className="mx-auto"
                        priority
                    />
                </div>
            </div>

            {/* Right panel - Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col">
                <div className="flex items-center justify-between p-4">
                    <div className="lg:hidden">
                        <Logo size="small" />
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/" className="text-sm font-medium hover:underline">
                            Home
                        </Link>
                        <Link href="/courses" className="text-sm font-medium hover:underline">
                            Courses
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-md space-y-8">{children}</div>
                </div>
            </div>
        </div>
    );
}
