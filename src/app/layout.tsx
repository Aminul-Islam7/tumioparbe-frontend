import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TouchHandler } from '@/components/providers/touch-handler';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/shared/navbar';

const fontSans = FontSans({
    subsets: ['latin'],
    variable: '--font-sans',
});

export const metadata: Metadata = {
    title: 'Tumio Parbe - Learn Anywhere, Succeed Everywhere',
    description: 'Online learning platform for students in Bangladesh',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head />
            <body
                className={cn(
                    'min-h-screen bg-background font-sans antialiased',
                    fontSans.variable
                )}
            >
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <div className="relative flex min-h-screen flex-col">
                        <Navbar />
                        <main className="flex-1">{children}</main>
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
