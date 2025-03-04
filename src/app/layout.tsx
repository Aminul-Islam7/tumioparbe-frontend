import type { Metadata } from 'next';
import { Maven_Pro as FontSans, Noto_Serif_Bengali } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TouchHandler } from '@/components/providers/touch-handler';
import { ToastProvider } from '@/components/ui/toast-provider';
import { ClientLayout } from '@/components/providers/client-layout';
import { AnimatedBlobs } from '@/components/ui/animated-blobs';

const fontSans = FontSans({
    subsets: ['latin'],
    variable: '--font-sans',
    weight: ['400', '500', '600', '700', '800', '900'],
});

const fontBengali = Noto_Serif_Bengali({
    subsets: ['bengali'],
    variable: '--font-bengali',
    weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
    title: 'Tumio Parbe - Learn Anywhere, Succeed Everywhere',
    description: 'Online learning platform for students in Bangladesh',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={cn(
                    'h-full bg-background font-sans antialiased',
                    fontSans.variable,
                    fontBengali.variable
                )}
            >
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <TouchHandler>
                        <ClientLayout>
                            <AnimatedBlobs />
                            {children}
                            <ToastProvider />
                        </ClientLayout>
                    </TouchHandler>
                </ThemeProvider>
            </body>
        </html>
    );
}
