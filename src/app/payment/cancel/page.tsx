'use client';

import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentCancelPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-neutral-900 dark:to-neutral-800 p-4">
            <div className="bg-card rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
                    <Ban className="w-12 h-12 text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold text-heading mb-2">Payment Cancelled</h1>
                <p className="text-body-muted mb-6">
                    Your payment was cancelled. No charges have been made to your account.
                </p>
                
                <div className="flex flex-col gap-3">
                    <Link href="/dashboard/payments">
                        <Button className="w-full" size="lg">
                            Try Again
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="outline" className="w-full" size="lg">
                            Go to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
