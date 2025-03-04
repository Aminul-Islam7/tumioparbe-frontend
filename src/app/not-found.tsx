import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Navbar from '@/components/shared/navbar';

export default function NotFound() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="space-y-8 max-w-md">
                    <div className="space-y-2">
                        <h1 className="text-6xl md:text-8xl font-bold text-tp_red">404</h1>
                        <h2 className="text-2xl md:text-3xl font-semibold">Page not found</h2>
                        <p className="text-muted-foreground">
                            Sorry, we couldn't find the page you're looking for.
                        </p>
                    </div>
                    <Link href="/">
                        <Button size="lg" className="gap-2">
                            <Home className="h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
