import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex-1 flex items-center justify-center min-h-screen py-8">
            <div className="container">
                <div className="mx-auto max-w-[450px] p-6 bg-background/70 dark:bg-card/70 backdrop-blur-sm rounded-lg shadow-[0_0px_50px_-5px_rgb(0_0_0_/0.15)]">
                    {children}
                </div>
            </div>
        </main>
    );
}
