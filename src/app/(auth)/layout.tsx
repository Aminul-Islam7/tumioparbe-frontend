import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex-1 flex items-center justify-center min-h-screen py-8 bg-gradient-to-br from-primary-100 via-page to-secondary-100 dark:from-primary-900/10 dark:via-page dark:to-secondary-900/10">
            <div className="container">
                <div className="mx-auto max-w-[450px] p-8 bg-card/90 dark:bg-card/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800">
                    {children}
                </div>
            </div>
        </main>
    );
}
