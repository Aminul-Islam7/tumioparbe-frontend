import Image from 'next/image';
import Link from 'next/link';
import Logo from '@/components/shared/logo';
import LightDarkSwitch from '@/components/shared/light-dark-switch';
import Navbar from '@/components/shared/navbar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-muted/50 min-h-screen flex items-center justify-center">
            <div className="container">
                <div className="mx-auto max-w-[450px] p-6 bg-background rounded-lg shadow-lg">
                    {children}
                </div>
            </div>
        </div>
    );
}
