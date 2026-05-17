'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
    CreditCard, 
    RefreshCw, 
    Search, 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    Clock,
    Loader2,
    ChevronDown,
    RotateCcw,
    Filter,
    X,
    User,
    BookOpen,
    FileText,
    ExternalLink
} from 'lucide-react';
import { adminPaymentApi, paymentApi } from '@/lib/api';
import { Payment } from '@/types';

// Helper function to format date in 12-hour format
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
    }) + ', ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
    });
};

const formatTimeOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

interface RecoveryResult {
    paymentId: string;
    status: 'success' | 'error' | 'pending';
    message: string;
    enrollment?: {
        id: number;
        student_name: string;
        course_name: string;
        batch_name: string;
    };
}

interface PaymentDetail extends Payment {
    invoice_details?: {
        id: number;
        month: string;
        amount: number;
        is_paid: boolean;
    };
    enrollment_details?: {
        id: number;
        student_name: string;
        course_name: string;
        batch_name: string;
        is_active: boolean;
    };
    bkash_query_result?: {
        success: boolean;
        transaction_status?: string;
        trx_id?: string;
        error?: string;
        status_code?: string;
        status_message?: string;
    };
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
    const [recoveryResults, setRecoveryResults] = useState<RecoveryResult[]>([]);
    const [recovering, setRecovering] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    
    // Payment detail modal
    const [selectedPayment, setSelectedPayment] = useState<PaymentDetail | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [queryingBkash, setQueryingBkash] = useState(false);
    const [recoveringPayment, setRecoveringPayment] = useState(false);

    // Fetch payments
    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await adminPaymentApi.getAllPayments();
            console.log('Payment API response:', response.data);
            
            // Handle different response formats
            let allPayments: Payment[] = [];
            if (Array.isArray(response.data)) {
                allPayments = response.data;
            } else if (response.data?.results && Array.isArray(response.data.results)) {
                allPayments = response.data.results;
            }
            
            // Sort by date - latest first
            allPayments.sort((a, b) => {
                const dateA = new Date(a.created_at || a.payment_create_time || 0).getTime();
                const dateB = new Date(b.created_at || b.payment_create_time || 0).getTime();
                return dateB - dateA;
            });
            
            // Apply client-side status filter
            if (statusFilter !== 'all') {
                allPayments = allPayments.filter((p: Payment) => p.status === statusFilter);
            }
            
            setPayments(allPayments);
        } catch (err: any) {
            console.error('Error fetching payments:', err);
            setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to load payments');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    // Filter payments by search query
    const filteredPayments = payments.filter(payment => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            payment.transaction_id?.toLowerCase().includes(query) ||
            payment.payment_id?.toLowerCase().includes(query) ||
            payment.status?.toLowerCase().includes(query) ||
            payment.student_name?.toLowerCase().includes(query) ||
            payment.course_name?.toLowerCase().includes(query)
        );
    });

    // Toggle payment selection
    const togglePaymentSelection = (paymentId: string) => {
        const newSelected = new Set(selectedPayments);
        if (newSelected.has(paymentId)) {
            newSelected.delete(paymentId);
        } else {
            newSelected.add(paymentId);
        }
        setSelectedPayments(newSelected);
    };

    // Select all filtered payments
    const selectAll = () => {
        const bkashPayments = filteredPayments
            .filter(p => p.payment_method === 'bKash' && p.payment_id)
            .map(p => p.payment_id!);
        setSelectedPayments(new Set(bkashPayments));
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedPayments(new Set());
    };

    // Recover single payment
    const recoverPayment = async (paymentId: string) => {
        try {
            setRecoveryResults(prev => [...prev, { 
                paymentId, 
                status: 'pending', 
                message: 'Recovering...' 
            }]);

            const response = await adminPaymentApi.recoverPayment(paymentId);
            const data = response.data;

            setRecoveryResults(prev => 
                prev.map(r => 
                    r.paymentId === paymentId 
                        ? { 
                            paymentId, 
                            status: data.status === 'success' ? 'success' : 'error',
                            message: data.message,
                            enrollment: data.enrollment
                        }
                        : r
                )
            );

            await fetchPayments();
        } catch (err: any) {
            setRecoveryResults(prev => 
                prev.map(r => 
                    r.paymentId === paymentId 
                        ? { 
                            paymentId, 
                            status: 'error',
                            message: err.response?.data?.message || 'Recovery failed'
                        }
                        : r
                )
            );
        }
    };

    // Recover selected payments
    const recoverSelectedPayments = async () => {
        if (selectedPayments.size === 0) return;
        
        setRecovering(true);
        setRecoveryResults([]);

        for (const paymentId of Array.from(selectedPayments)) {
            await recoverPayment(paymentId);
        }

        setRecovering(false);
        clearSelection();
    };

    // Open payment detail modal
    const openPaymentDetail = async (payment: Payment) => {
        setSelectedPayment(payment as PaymentDetail);
        setShowDetailModal(true);
    };

    // Query bKash status for selected payment
    const queryBkashStatus = async () => {
        if (!selectedPayment?.payment_id) return;
        
        setQueryingBkash(true);
        try {
            const response = await adminPaymentApi.queryPaymentStatus(selectedPayment.payment_id);
            setSelectedPayment(prev => prev ? {
                ...prev,
                bkash_query_result: {
                    success: true,
                    transaction_status: response.data.transaction_status,
                    trx_id: response.data.bkash_payment_id
                }
            } : null);
            await fetchPayments();
        } catch (err: any) {
            const errorData = err.response?.data || {};
            setSelectedPayment(prev => prev ? {
                ...prev,
                bkash_query_result: {
                    success: false,
                    error: errorData.error || 'Query failed',
                    status_code: errorData.bkash_status_code,
                    status_message: errorData.bkash_status_message
                }
            } : null);
        } finally {
            setQueryingBkash(false);
        }
    };

    // Recover payment from detail modal
    const recoverFromDetail = async () => {
        if (!selectedPayment?.payment_id) return;
        
        setRecoveringPayment(true);
        try {
            const response = await adminPaymentApi.recoverPayment(selectedPayment.payment_id);
            const data = response.data;
            
            if (data.status === 'success' && data.enrollment) {
                setSelectedPayment(prev => prev ? {
                    ...prev,
                    enrollment_details: {
                        id: data.enrollment!.id,
                        student_name: data.enrollment!.student_name,
                        course_name: data.enrollment!.course_name,
                        batch_name: data.enrollment!.batch_name,
                        is_active: true
                    }
                } : null);
            }
            
            alert(data.message);
            await fetchPayments();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Recovery failed');
        } finally {
            setRecoveringPayment(false);
        }
    };

    // Get status badge with proper dark mode styles
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30">
                        <CheckCircle className="w-3 h-3 shrink-0" />
                        Completed
                    </span>
                );
            case 'Failed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30">
                        <XCircle className="w-3 h-3 shrink-0" />
                        Failed
                    </span>
                );
            case 'Initiated':
            case 'Pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30">
                        <Clock className="w-3 h-3 shrink-0" />
                        {status}
                    </span>
                );
            case 'Cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-500/30">
                        <XCircle className="w-3 h-3 shrink-0" />
                        Cancelled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-500/30">
                        {status}
                    </span>
                );
        }
    };

    // Check if payment might need recovery
    const mightNeedRecovery = (payment: Payment) => {
        // Payment completed but no enrollment associated
        return payment.status === 'Completed' && !payment.course_name;
    };

    return (
        <div className="space-y-6">
            {/* Recovery Results */}
            {recoveryResults.length > 0 && (
                <div className="bg-card rounded-xl border border-default p-4">
                    <h3 className="font-semibold text-heading mb-3 flex items-center gap-2">
                        <RotateCcw className="w-5 h-5" />
                        Recovery Results
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {recoveryResults.map((result, index) => (
                            <div 
                                key={index}
                                className={`p-3 rounded-lg text-sm border ${
                                    result.status === 'success' 
                                        ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30' 
                                        : result.status === 'error'
                                        ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                                        : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    {result.status === 'success' && <CheckCircle className="w-4 h-4 mt-0.5" />}
                                    {result.status === 'error' && <XCircle className="w-4 h-4 mt-0.5" />}
                                    {result.status === 'pending' && <Loader2 className="w-4 h-4 mt-0.5 animate-spin" />}
                                    <div>
                                        <p className="font-medium font-mono text-xs">{result.paymentId}</p>
                                        <p>{result.message}</p>
                                        {result.enrollment && (
                                            <p className="mt-1 text-xs opacity-80">
                                                Enrolled: {result.enrollment.student_name} in {result.enrollment.course_name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => setRecoveryResults([])}
                        className="mt-3 text-sm text-body-muted hover:text-heading"
                    >
                        Clear results
                    </button>
                </div>
            )}

            {/* Filters and Search */}
            <div className="bg-card rounded-xl border border-default p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted" />
                        <input
                            type="text"
                            placeholder="Search by transaction ID, student, course..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-default rounded-lg bg-surface text-heading placeholder:text-body-muted focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative w-full sm:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 px-4 py-2 border border-default rounded-lg bg-surface text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <Filter className="w-4 h-4 shrink-0" />
                            <span className="flex-1 text-left sm:flex-initial">Status: {statusFilter === 'all' ? 'All' : statusFilter}</span>
                            <ChevronDown className="w-4 h-4 shrink-0" />
                        </button>
                        
                        {showFilters && (
                            <div className="absolute left-0 sm:left-auto right-0 mt-2 w-full sm:w-48 bg-card border border-default rounded-lg shadow-lg z-10">
                                {['all', 'Completed', 'Initiated', 'Failed', 'Cancelled'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setStatusFilter(status);
                                            setShowFilters(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                            statusFilter === status 
                                                ? 'bg-accent text-accent-foreground font-semibold' 
                                                : 'text-heading'
                                        }`}
                                    >
                                        {status === 'all' ? 'All Statuses' : status}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>


                </div>

                {/* Bulk Actions */}
                {selectedPayments.size > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
                        <span className="text-sm font-medium text-heading">
                            {selectedPayments.size} payment(s) selected
                        </span>
                        <button
                            onClick={recoverSelectedPayments}
                            disabled={recovering}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {recovering ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RotateCcw className="w-4 h-4" />
                            )}
                            Recover Selected
                        </button>
                        <button
                            onClick={clearSelection}
                            className="text-sm text-body-muted hover:text-heading"
                        >
                            Clear selection
                        </button>
                    </div>
                )}
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Payments Table */}
            <div className="bg-card rounded-xl border border-default overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="p-12 text-center">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 text-body-subtle" />
                        <p className="text-body-muted">No payments found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-surface border-b border-default">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedPayments.size === filteredPayments.filter(p => p.payment_id).length && selectedPayments.size > 0}
                                            onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                                            className="rounded border-default"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wider">
                                        Transaction
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wider">
                                        Invoice / Enrollment
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                                {filteredPayments.map((payment) => (
                                    <tr
                                        key={payment.id}
                                        onClick={() => openPaymentDetail(payment)}
                                        className={`cursor-pointer hover:bg-surface/70 transition-colors ${mightNeedRecovery(payment) ? 'bg-yellow-500/5' : ''}`}
                                    >
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            {payment.payment_id && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPayments.has(payment.payment_id)}
                                                    onChange={() => togglePaymentSelection(payment.payment_id!)}
                                                    className="rounded border-default"
                                                />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <span className="font-mono text-sm text-heading">
                                                    {payment.transaction_id || '-'}
                                                </span>
                                                <p className="text-xs text-body-muted mt-0.5">
                                                    {payment.payment_method}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {payment.student_name || payment.course_name ? (
                                                <div>
                                                    <p className="text-sm font-medium text-heading flex items-center gap-1">
                                                        <User className="w-3 h-3 shrink-0" />
                                                        {payment.student_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-body-muted flex items-center gap-1 mt-0.5">
                                                        <BookOpen className="w-3 h-3 shrink-0" />
                                                        {payment.course_name || 'No course'} 
                                                        {payment.month && ` • ${payment.month}`}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    No enrollment linked
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-heading">
                                            ৳{payment.amount}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(payment.status)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-heading whitespace-nowrap">
                                            {payment.created_at || payment.payment_create_time ? (
                                                <div className="flex flex-col">
                                                    <span>{formatDateOnly(payment.created_at || payment.payment_create_time)}</span>
                                                    <span className="text-xs text-body-muted font-medium mt-0.5">{formatTimeOnly(payment.created_at || payment.payment_create_time)}</span>
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Help Section */}
            <div className="bg-surface border border-default rounded-xl p-4">
                <h3 className="font-semibold text-heading mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-accent" />
                    Payment Recovery Help
                </h3>
                <ul className="text-sm text-body space-y-1">
                    <li>• <strong>View Details:</strong> Click on any payment to see full details including bKash status and recovery options</li>
                    <li>• <strong>Yellow Rows:</strong> Payments that might need recovery (completed but no enrollment linked)</li>
                    <li>• <strong>Bulk Recovery:</strong> Select multiple payments and recover them all at once</li>
                    <li>• For more advanced options, use Django Admin or: <code className="bg-surface-hover px-1 rounded font-mono text-xs">python manage.py recover_payment</code></li>
                </ul>
            </div>

            {/* Payment Detail Modal */}
            {showDetailModal && selectedPayment && (
                <div 
                    className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm"
                    onClick={() => setShowDetailModal(false)}
                >
                    <div 
                        className="relative z-modal bg-card rounded-2xl border border-default shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-card border-b border-default px-6 py-4 flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-semibold text-heading">Payment Details</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 hover:bg-surface rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-body-muted shrink-0" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            {/* Payment Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-heading uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 shrink-0" />
                                    Payment Information
                                </h3>
                                <div className="bg-surface rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-body-muted">Transaction ID</p>
                                            <p className="font-mono text-sm text-heading">{selectedPayment.transaction_id || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-body-muted">bKash Payment ID</p>
                                            <p className="font-mono text-sm text-heading">{selectedPayment.payment_id || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-body-muted">Amount</p>
                                            <p className="font-semibold text-heading">৳{selectedPayment.amount}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-body-muted">Method</p>
                                            <p className="text-heading">{selectedPayment.payment_method}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-body-muted">Status</p>
                                            <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-body-muted">Date</p>
                                            <p className="text-sm text-heading">
                                                {selectedPayment.created_at || selectedPayment.payment_create_time
                                                    ? formatDate(selectedPayment.created_at || selectedPayment.payment_create_time)
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice & Enrollment Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-heading uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 shrink-0" />
                                    Invoice & Enrollment
                                </h3>
                                <div className="bg-surface rounded-lg p-4">
                                    {selectedPayment.student_name || selectedPayment.course_name ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-body-muted">Student</p>
                                                    {selectedPayment.student_id ? (
                                                        <Link href={`/admin/students/${selectedPayment.student_id}`} className="group text-heading hover:text-primary transition-colors inline-flex items-center gap-1.5">
                                                            <ExternalLink className="w-3.5 h-3.5 text-body-muted group-hover:text-primary transition-colors shrink-0" />
                                                            <span>{selectedPayment.student_name}</span>
                                                        </Link>
                                                    ) : (
                                                        <p className="text-heading">{selectedPayment.student_name || '-'}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-body-muted">Course</p>
                                                    <p className="text-heading">{selectedPayment.course_name || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-body-muted">Batch</p>
                                                    {selectedPayment.batch_id ? (
                                                        <Link href={`/admin/courses/${selectedPayment.course_id}/batches/${selectedPayment.batch_id}`} className="group text-heading hover:text-primary transition-colors inline-flex items-center gap-1.5">
                                                            <ExternalLink className="w-3.5 h-3.5 text-body-muted group-hover:text-primary transition-colors shrink-0" />
                                                            <span>{selectedPayment.batch_name}</span>
                                                        </Link>
                                                    ) : (
                                                        <p className="text-heading">{selectedPayment.batch_name || '-'}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-body-muted">Month</p>
                                                    <p className="text-heading">{selectedPayment.month || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-2 border-t border-default">
                                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                <span className="text-sm text-green-700 dark:text-green-400">Enrollment linked successfully</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2 shrink-0" />
                                            <p className="text-yellow-700 dark:text-yellow-400 font-medium">No enrollment linked to this payment</p>
                                            <p className="text-sm text-body-muted mt-1">This payment might need recovery if it was meant for a new enrollment.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* bKash Status Query */}
                            {selectedPayment.payment_method === 'bKash' && selectedPayment.payment_id && (
                                <div>
                                    <h3 className="text-sm font-semibold text-heading uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4 shrink-0" />
                                        bKash Status
                                    </h3>
                                    <div className="bg-surface rounded-lg p-4">
                                        {selectedPayment.bkash_query_result ? (
                                            selectedPayment.bkash_query_result.success ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                        <span className="text-green-700 dark:text-green-400">Query successful</span>
                                                    </div>
                                                    <p className="text-sm text-body-muted">
                                                        Transaction Status: <span className="text-heading font-medium">{selectedPayment.bkash_query_result.transaction_status}</span>
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                        <span className="text-red-700 dark:text-red-400">{selectedPayment.bkash_query_result.error}</span>
                                                    </div>
                                                    {selectedPayment.bkash_query_result.status_code && (
                                                        <p className="text-xs text-body-muted">
                                                            Error Code: {selectedPayment.bkash_query_result.status_code} - {selectedPayment.bkash_query_result.status_message}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-body-muted">
                                                        This may happen for old payments that are no longer queryable from bKash.
                                                    </p>
                                                </div>
                                            )
                                        ) : (
                                            <div className="text-left">
                                                <p className="text-sm text-body-muted mb-3">Query bKash to check the current payment status</p>
                                                <button
                                                     onClick={queryBkashStatus}
                                                     disabled={queryingBkash}
                                                     className="inline-flex items-center gap-2 px-4 py-2 border border-default rounded-lg bg-surface text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                                 >
                                                    {queryingBkash ? (
                                                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                                    ) : (
                                                        <RefreshCw className="w-4 h-4 shrink-0" />
                                                    )}
                                                    Query bKash Status
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Recovery Actions */}
                            {selectedPayment.payment_method === 'bKash' && selectedPayment.payment_id && (
                                <div>
                                    <h3 className="text-sm font-semibold text-heading uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <RotateCcw className="w-4 h-4 shrink-0" />
                                        Recovery Actions
                                    </h3>
                                    <div className="bg-surface rounded-lg p-4">
                                        <p className="text-sm text-body-muted mb-4">
                                            If this payment was successful but the enrollment wasn't created, use the recovery action below. 
                                            This will verify the payment with bKash and create the enrollment automatically.
                                        </p>
                                        <button
                                            onClick={recoverFromDetail}
                                            disabled={recoveringPayment}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {recoveringPayment ? (
                                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                            ) : (
                                                <RotateCcw className="w-4 h-4 shrink-0" />
                                            )}
                                            Recover Payment & Enrollment
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-card border-t border-default px-6 py-4 flex justify-end shrink-0">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 border border-default rounded-lg text-heading hover:bg-surface"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

