import React from 'react';
import Navbar from '@/components/shared/navbar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <main className="flex-1 flex items-center justify-center py-8">
                <div className="container">
                    <div className="mx-auto max-w-[450px] p-6 bg-background/70 dark:bg-card/70 backdrop-blur-sm rounded-lg shadow-[0_0px_50px_-5px_rgb(0_0_0_/0.15)]">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
