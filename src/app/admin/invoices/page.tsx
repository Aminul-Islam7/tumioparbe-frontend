'use client';

import React from 'react';
import { Receipt } from 'lucide-react';

export default function AdminInvoicesPage() {
    return (
        <div className="bg-card rounded-2xl border border-default p-12 text-center">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-body-subtle" />
            <h2 className="text-xl font-semibold text-heading mb-2">Coming Soon</h2>
            <p className="text-body-muted max-w-md mx-auto">
                The invoices management page is under development.
            </p>
        </div>
    );
}
