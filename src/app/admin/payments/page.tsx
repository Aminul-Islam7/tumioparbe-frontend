'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';

export default function AdminPaymentsPage() {
    return (
        <div className="bg-card rounded-2xl border border-default p-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-body-subtle" />
            <h2 className="text-xl font-semibold text-heading mb-2">Coming Soon</h2>
            <p className="text-body-muted max-w-md mx-auto">
                The payments management page is under development.
            </p>
        </div>
    );
}
