'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { paymentApi } from '@/lib/api';
import { Invoice, Payment } from '@/types';
import { Button } from '@/components/ui/button';
import {
    CheckCircle,
    AlertCircle,
    CreditCard,
    Loader2,
    CheckSquare,
    Square,
} from 'lucide-react';

// Combined type for display
interface PaymentItem {
    id: number;
    type: 'invoice' | 'payment';
    studentName: string;
    courseName: string;
    batchName: string;
    month: string;
    monthDisplay: string;
    amount: number;
    isPaid: boolean;
    transactionId?: string;
    paymentMethod?: string;
    paymentDate?: string;
}

export default function PaymentsPage() {
    const { user } = useAuth(true);
    const { showSuccess, showError } = useToast();

    const [loading, setLoading] = useState(true);
    const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
    const [paidPayments, setPaidPayments] = useState<Payment[]>([]);
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [processingPayment, setProcessingPayment] = useState(false);

    // Track if initial fetch has been done
    const hasFetched = useRef(false);

    // Fetch data
    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch pending invoices and payment history in parallel
            const [invoicesRes, paymentsRes] = await Promise.all([
                paymentApi.getPendingInvoices(),
                paymentApi.getPaymentHistory(),
            ]);

            // Parse responses - handle both array and paginated formats
            const invoices = Array.isArray(invoicesRes.data)
                ? invoicesRes.data
                : invoicesRes.data?.results || [];

            const payments = Array.isArray(paymentsRes.data)
                ? paymentsRes.data
                : paymentsRes.data?.results || [];

            setPendingInvoices(invoices);
            setPaidPayments(payments);
        } catch (error) {
            console.error('Failed to fetch payment data:', error);
            showError('Error', 'Failed to load payment data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on mount
    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Combine and sort items - unpaid first, then by date
    const allItems = useMemo((): PaymentItem[] => {
        const items: PaymentItem[] = [];

        // Add pending invoices (unpaid)
        pendingInvoices.forEach((inv) => {
            items.push({
                id: inv.id,
                type: 'invoice',
                studentName: inv.student_name || 'Unknown Student',
                courseName: inv.course_name || 'Unknown Course',
                batchName: inv.batch_name || '',
                month: inv.month,
                monthDisplay: inv.month_display || formatMonth(inv.month),
                amount: inv.amount,
                isPaid: false,
            });
        });

        // Add paid payments
        paidPayments.forEach((pay) => {
            items.push({
                id: pay.id,
                type: 'payment',
                studentName: pay.student_name || 'Unknown Student',
                courseName: pay.course_name || 'Unknown Course',
                batchName: pay.batch_name || '',
                month: pay.month || '',
                monthDisplay: pay.month || '',
                amount: pay.amount,
                isPaid: true,
                transactionId: pay.transaction_id,
                paymentMethod: pay.payment_method,
                paymentDate: pay.payment_execute_time,
            });
        });

        // Sort: unpaid first, then by date descending
        items.sort((a, b) => {
            // Unpaid items first
            if (!a.isPaid && b.isPaid) return -1;
            if (a.isPaid && !b.isPaid) return 1;

            // Then sort by month/date descending
            const dateA = new Date(a.month || '');
            const dateB = new Date(b.month || '');
            return dateB.getTime() - dateA.getTime();
        });

        return items;
    }, [pendingInvoices, paidPayments]);

    // Format month string
    function formatMonth(monthStr: string): string {
        try {
            const date = new Date(monthStr);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        } catch {
            return monthStr;
        }
    }

    // Toggle invoice selection
    const toggleInvoiceSelection = (invoiceId: number) => {
        setSelectedInvoices((prev) =>
            prev.includes(invoiceId)
                ? prev.filter((id) => id !== invoiceId)
                : [...prev, invoiceId]
        );
    };

    // Select all pending invoices
    const selectAllPending = () => {
        const allPendingIds = pendingInvoices.map((inv) => inv.id);
        if (selectedInvoices.length === allPendingIds.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(allPendingIds);
        }
    };

    // Calculate total for selected invoices
    const selectedTotal = useMemo(() => {
        return pendingInvoices
            .filter((inv) => selectedInvoices.includes(inv.id))
            .reduce((sum, inv) => sum + parseFloat(String(inv.amount)), 0);
    }, [pendingInvoices, selectedInvoices]);

    // Calculate total pending
    const totalPending = useMemo(() => {
        return pendingInvoices.reduce((sum, inv) => sum + parseFloat(String(inv.amount)), 0);
    }, [pendingInvoices]);

    // Get callback URL for bKash
    const getCallbackUrl = () => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/dashboard/payments`;
        }
        return '/dashboard/payments';
    };

    // Handle single invoice payment
    const handlePayInvoice = async (invoiceId: number) => {
        if (!user?.phone) {
            showError('Error', 'User phone number not available.');
            return;
        }

        try {
            setProcessingPayment(true);
            const response = await paymentApi.payInvoice(
                invoiceId,
                getCallbackUrl(),
                user.phone
            );

            if (response.data?.bkash_url) {
                showSuccess('Payment Initiated', 'Redirecting to payment gateway...');
                // Redirect to bKash payment page
                window.location.href = response.data.bkash_url;
            } else {
                showSuccess('Payment Initiated', 'Payment process started.');
                await fetchData();
            }
        } catch (error) {
            console.error('Failed to initiate payment:', error);
            showError('Error', 'Failed to initiate payment. Please try again.');
        } finally {
            setProcessingPayment(false);
        }
    };

    // Handle bulk payment
    const handleBulkPayment = async () => {
        if (selectedInvoices.length === 0) {
            showError('Error', 'Please select at least one invoice to pay.');
            return;
        }

        if (!user?.phone) {
            showError('Error', 'User phone number not available.');
            return;
        }

        try {
            setProcessingPayment(true);
            const response = await paymentApi.bulkPayInvoices(
                selectedInvoices,
                getCallbackUrl(),
                user.phone
            );

            if (response.data?.bkash_url) {
                showSuccess('Payment Initiated', 'Redirecting to payment gateway...');
                window.location.href = response.data.bkash_url;
            } else {
                showSuccess(
                    'Payment Initiated',
                    `Payment for ${selectedInvoices.length} invoice(s) has been initiated.`
                );
                setSelectedInvoices([]);
                await fetchData();
            }
        } catch (error) {
            console.error('Failed to initiate bulk payment:', error);
            showError('Error', 'Failed to initiate bulk payment. Please try again.');
        } finally {
            setProcessingPayment(false);
        }
    };

    // Handle pay all
    const handlePayAll = async () => {
        if (pendingInvoices.length === 0) {
            showError('Error', 'No pending invoices to pay.');
            return;
        }

        if (!user?.phone) {
            showError('Error', 'User phone number not available.');
            return;
        }

        const allIds = pendingInvoices.map((inv) => inv.id);
        try {
            setProcessingPayment(true);
            const response = await paymentApi.bulkPayInvoices(
                allIds,
                getCallbackUrl(),
                user.phone
            );

            if (response.data?.bkash_url) {
                showSuccess('Payment Initiated', 'Redirecting to payment gateway...');
                window.location.href = response.data.bkash_url;
            } else {
                showSuccess(
                    'Payment Initiated',
                    `Payment for all ${allIds.length} invoice(s) has been initiated.`
                );
                setSelectedInvoices([]);
                await fetchData();
            }
        } catch (error) {
            console.error('Failed to initiate payment:', error);
            showError('Error', 'Failed to initiate payment. Please try again.');
        } finally {
            setProcessingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-tangerine-100 dark:bg-tangerine-900/30 animate-pulse" />
                    <Loader2 className="h-8 w-8 animate-spin text-tangerine-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-body-muted mt-4">Loading payment data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-card-achievements-bg border-2 border-card-achievements-border rounded-card p-4 sm:p-6 shadow-card">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="text-center md:text-left">
                        <h2 className="text-xl font-bold text-heading">Payment Summary</h2>
                        <p className="text-body-muted text-sm mt-1">
                            {pendingInvoices.length === 0
                                ? 'All payments are up to date!'
                                : `You have ${pendingInvoices.length} pending payment${pendingInvoices.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    {pendingInvoices.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-4">
                            <div className="bg-tangerine-50 dark:bg-tangerine-800/30 px-5 py-3 rounded-2xl border border-tangerine-200 dark:border-tangerine-800">
                                <div className="text-xs text-center text-tangerine-600 dark:text-tangerine-400 font-medium">Total Due</div>
                                <div className="text-2xl font-bold text-tangerine-700 dark:text-tangerine-300">৳{totalPending.toLocaleString()}</div>
                            </div>

                            <Button
                                onClick={handlePayAll}
                                disabled={processingPayment}
                                variant="tangerine"
                                size="lg"
                                className="flex-col h-auto py-3 px-6 gap-0.5"
                            >
                                <div className="flex items-center gap-2">
                                    {processingPayment && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    <span className="font-semibold">Pay All</span>
                                </div>
                                <span className="text-sm font-medium">৳{totalPending.toLocaleString()}</span>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Bulk selection controls */}
                {pendingInvoices.length > 1 && selectedInvoices.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-tangerine-200 dark:border-tangerine-800 flex items-center justify-between">
                        <div className="text-sm text-heading">
                            <span className="font-bold text-primary">{selectedInvoices.length}</span> invoice(s)
                            selected (৳{selectedTotal.toLocaleString()})
                        </div>
                        <Button
                            onClick={handleBulkPayment}
                            disabled={processingPayment}
                            variant="tangerine"
                        >
                            {processingPayment ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CreditCard className="mr-2 h-4 w-4" />
                            )}
                            Pay Selected
                        </Button>
                    </div>
                )}
            </div>

            {/* All Payments List */}
            {allItems.length === 0 ? (
                <div className="bg-card rounded-card border-2 border-dashed border-neutral-300 dark:border-neutral-600 p-8 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-body-muted" />
                    </div>
                    <h2 className="text-xl font-semibold text-heading mb-2">No Payment Records</h2>
                    <p className="text-body-muted">
                        You don&apos;t have any payment records yet.
                    </p>
                </div>
            ) : (
                <div className="bg-card rounded-card border shadow-card overflow-hidden">
                    {/* Desktop Table Header - hidden on mobile */}
                    <div className="hidden md:grid grid-cols-12 gap-2 p-4 bg-secondary-50 dark:bg-secondary-900/20 font-medium text-sm text-heading border-b border-secondary-100 dark:border-secondary-800">
                        {pendingInvoices.length > 0 && (
                            <div className="col-span-1 flex items-center">
                                <button
                                    onClick={selectAllPending}
                                    className="p-1 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
                                    title={
                                        selectedInvoices.length === pendingInvoices.length
                                            ? 'Deselect all'
                                            : 'Select all pending'
                                    }
                                >
                                    {selectedInvoices.length === pendingInvoices.length &&
                                    pendingInvoices.length > 0 ? (
                                        <CheckSquare className="h-5 w-5 text-primary" />
                                    ) : (
                                        <Square className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        )}
                        <div className={pendingInvoices.length > 0 ? 'col-span-2' : 'col-span-3'}>
                            Student
                        </div>
                        <div className="col-span-3">Course</div>
                        <div className="col-span-2">Month</div>
                        <div className="col-span-2 text-right">Amount</div>
                        <div className="col-span-2 text-right">Action</div>
                    </div>

                    {/* Mobile Select All Header - shown only on mobile when there are pending invoices */}
                    {pendingInvoices.length > 0 && (
                        <div className="md:hidden flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-900/20 border-b border-secondary-100 dark:border-secondary-800">
                            <button
                                onClick={selectAllPending}
                                className="flex items-center gap-2 p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors text-sm font-medium"
                            >
                                {selectedInvoices.length === pendingInvoices.length &&
                                pendingInvoices.length > 0 ? (
                                    <CheckSquare className="h-5 w-5 text-primary" />
                                ) : (
                                    <Square className="h-5 w-5" />
                                )}
                                <span>{selectedInvoices.length === pendingInvoices.length ? 'Deselect All' : 'Select All'}</span>
                            </button>
                            <span className="text-sm text-body-muted">
                                {pendingInvoices.length} pending
                            </span>
                        </div>
                    )}

                    {/* Table Body / Card List */}
                    <div className="divide-y">
                        {allItems.map((item) => (
                            <div
                                key={`${item.type}-${item.id}`}
                                className={`transition-colors ${
                                    !item.isPaid
                                        ? 'bg-amber-50/50 dark:bg-amber-900/10'
                                        : ''
                                }`}
                            >
                                {/* Desktop Row */}
                                <div
                                    className={`hidden md:grid grid-cols-12 gap-2 p-4 items-center text-sm ${
                                        !item.isPaid
                                            ? 'hover:bg-amber-100/50 dark:hover:bg-amber-900/20'
                                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                    }`}
                                >
                                    {/* Checkbox for pending invoices */}
                                    {pendingInvoices.length > 0 && (
                                        <div className="col-span-1 flex items-center">
                                            {!item.isPaid ? (
                                                <button
                                                    onClick={() => toggleInvoiceSelection(item.id)}
                                                    className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                                >
                                                    {selectedInvoices.includes(item.id) ? (
                                                        <CheckSquare className="h-5 w-5 text-primary" />
                                                    ) : (
                                                        <Square className="h-5 w-5" />
                                                    )}
                                                </button>
                                            ) : (
                                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                            )}
                                        </div>
                                    )}

                                    {/* Student Name */}
                                    <div
                                        className={
                                            pendingInvoices.length > 0 ? 'col-span-2' : 'col-span-3'
                                        }
                                    >
                                        <span className="font-medium">{item.studentName}</span>
                                    </div>

                                    {/* Course & Batch */}
                                    <div className="col-span-3">
                                        <div>{item.courseName}</div>
                                        {item.batchName && (
                                            <div className="text-xs text-muted-foreground">
                                                {item.batchName}
                                            </div>
                                        )}
                                    </div>

                                    {/* Month */}
                                    <div className="col-span-2">{item.monthDisplay}</div>

                                    {/* Amount */}
                                    <div className="col-span-2 text-right font-medium">
                                        ৳{item.amount.toLocaleString()}
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-2 text-right">
                                        {!item.isPaid ? (
                                            <Button
                                                size="sm"
                                                onClick={() => handlePayInvoice(item.id)}
                                                disabled={processingPayment}
                                                variant="tangerine"
                                            >
                                                {processingPayment ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CreditCard className="h-4 w-4 mr-1" />
                                                        Pay
                                                    </>
                                                )}
                                            </Button>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                                <CheckCircle className="h-3.5 w-3.5" />
                                                Paid
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile Card */}
                                <div
                                    className={`md:hidden p-4 space-y-3 ${
                                        !item.isPaid
                                            ? 'hover:bg-amber-100/50 dark:hover:bg-amber-900/20'
                                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                    }`}
                                >
                                    {/* Top row: Checkbox/Status + Student + Amount */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            {/* Checkbox or Paid status */}
                                            <div className="shrink-0 pt-0.5">
                                                {!item.isPaid ? (
                                                    <button
                                                        onClick={() => toggleInvoiceSelection(item.id)}
                                                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                                    >
                                                        {selectedInvoices.includes(item.id) ? (
                                                            <CheckSquare className="h-5 w-5 text-primary" />
                                                        ) : (
                                                            <Square className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                ) : (
                                                    <CheckCircle className="h-5 w-5 text-emerald-500 ml-1" />
                                                )}
                                            </div>
                                            
                                            {/* Student & Course info */}
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-heading truncate">
                                                    {item.studentName}
                                                </div>
                                                <div className="text-sm text-body-muted truncate">
                                                    {item.courseName}
                                                    {item.batchName && ` • ${item.batchName}`}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Amount */}
                                        <div className="text-right shrink-0">
                                            <div className="font-bold text-lg text-heading">
                                                ৳{item.amount.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-body-muted">
                                                {item.monthDisplay}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action row */}
                                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                        {item.isPaid ? (
                                            <>
                                                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Payment Complete
                                                </span>
                                                {item.transactionId && (
                                                    <span className="text-xs text-body-muted truncate max-w-[120px]">
                                                        TXN: {item.transactionId}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-sm font-medium">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Payment Due
                                                </span>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handlePayInvoice(item.id)}
                                                    disabled={processingPayment}
                                                    variant="tangerine"
                                                >
                                                    {processingPayment ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <CreditCard className="h-4 w-4 mr-1" />
                                                            Pay Now
                                                        </>
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
