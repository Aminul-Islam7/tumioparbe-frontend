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
                <Loader2 className="h-10 w-10 animate-spin text-tp_red mb-4" />
                <p className="text-muted-foreground">Loading payment data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-background rounded-lg border p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-semibold">Payment Summary</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            {pendingInvoices.length === 0
                                ? 'All payments are up to date!'
                                : `You have ${pendingInvoices.length} pending payment${pendingInvoices.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    {pendingInvoices.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="bg-muted/50 px-4 py-2 rounded-lg">
                                <div className="text-xs text-muted-foreground">Total Due</div>
                                <div className="text-xl font-bold">৳{totalPending.toLocaleString()}</div>
                            </div>

                            <Button
                                onClick={handlePayAll}
                                disabled={processingPayment}
                                className="bg-tp_red hover:bg-red-600"
                            >
                                {processingPayment ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CreditCard className="mr-2 h-4 w-4" />
                                )}
                                Pay All (৳{totalPending.toLocaleString()})
                            </Button>
                        </div>
                    )}
                </div>

                {/* Bulk selection controls */}
                {pendingInvoices.length > 1 && selectedInvoices.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div className="text-sm">
                            <span className="font-medium">{selectedInvoices.length}</span> invoice(s)
                            selected (৳{selectedTotal.toLocaleString()})
                        </div>
                        <Button
                            onClick={handleBulkPayment}
                            disabled={processingPayment}
                            className="bg-tp_red hover:bg-red-600"
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
                <div className="bg-background rounded-lg border p-8 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <h2 className="text-xl font-medium mb-2">No Payment Records</h2>
                    <p className="text-muted-foreground">
                        You don&apos;t have any payment records yet.
                    </p>
                </div>
            ) : (
                <div className="bg-background rounded-lg border overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 p-4 bg-muted font-medium text-sm">
                        {pendingInvoices.length > 0 && (
                            <div className="col-span-1 flex items-center">
                                <button
                                    onClick={selectAllPending}
                                    className="p-1 hover:bg-background/50 rounded"
                                    title={
                                        selectedInvoices.length === pendingInvoices.length
                                            ? 'Deselect all'
                                            : 'Select all pending'
                                    }
                                >
                                    {selectedInvoices.length === pendingInvoices.length &&
                                    pendingInvoices.length > 0 ? (
                                        <CheckSquare className="h-5 w-5 text-tp_red" />
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

                    {/* Table Body */}
                    <div className="divide-y">
                        {allItems.map((item) => (
                            <div
                                key={`${item.type}-${item.id}`}
                                className={`grid grid-cols-12 gap-2 p-4 items-center text-sm ${
                                    !item.isPaid
                                        ? 'bg-yellow-50/50 dark:bg-yellow-900/10'
                                        : 'hover:bg-muted/30'
                                }`}
                            >
                                {/* Checkbox for pending invoices */}
                                {pendingInvoices.length > 0 && (
                                    <div className="col-span-1 flex items-center">
                                        {!item.isPaid ? (
                                            <button
                                                onClick={() => toggleInvoiceSelection(item.id)}
                                                className="p-1 hover:bg-background/50 rounded"
                                            >
                                                {selectedInvoices.includes(item.id) ? (
                                                    <CheckSquare className="h-5 w-5 text-tp_red" />
                                                ) : (
                                                    <Square className="h-5 w-5" />
                                                )}
                                            </button>
                                        ) : (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
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
                                            className="bg-tp_red hover:bg-red-600"
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
                                        <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            Paid
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
