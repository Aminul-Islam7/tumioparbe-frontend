'use client';

import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentFailurePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-neutral-900 dark:to-neutral-800 p-4">
            <div className="bg-card rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-heading mb-2">Payment Failed</h1>
                <p className="text-body-muted mb-6">
                    Your payment could not be processed. Please try again or contact support if the issue persists.
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
