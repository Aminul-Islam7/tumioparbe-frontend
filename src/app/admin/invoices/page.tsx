'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
    Receipt,
    Search,
    X,
    Filter,
    ArrowUpDown,
    RefreshCw,
    Plus,
    CheckCircle2,
    Clock,
    AlertTriangle,
    CheckCheck,
    Undo2,
    Trash2,
    Pencil,
    Phone,
    Calendar,
    ExternalLink,
    AlertCircle,
    ChevronDown,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/adminApi';
import { AdminInvoice, InvoiceStats, EnrollmentForSelect } from '@/types';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: string | number): string {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(n)) return '৳0';
    return '৳' + Math.round(n).toLocaleString('en-IN');
}

function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function currentMonthInput(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthInputToIso(val: string): string {
    return val ? val + '-01' : '';
}

function isoToMonthInput(val: string): string {
    return val ? val.substring(0, 7) : '';
}

// ─── Skeleton Loaders ─────────────────────────────────────────────────────────

function StatCardSkeleton() {
    return (
        <div className="bg-card rounded-2xl border border-default p-4 sm:p-5 animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-200 dark:bg-neutral-700" />
                <div className="w-16 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            </div>
            <div className="h-7 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-700 mb-1" />
            <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
    );
}

function TableRowSkeleton() {
    return (
        <tr className="border-b border-default">
            {[55, 65, 40, 30, 35, 25].map((w, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="animate-skeleton h-4 rounded-lg" style={{ width: `${w}%` }} />
                    {i === 0 && <div className="animate-skeleton h-3 rounded mt-1.5 w-2/5" />}
                </td>
            ))}
        </tr>
    );
}

function CardSkeleton() {
    return (
        <div className="p-4 border-b border-default animate-pulse">
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                </div>
                <div className="w-16 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 shrink-0" />
            </div>
        </div>
    );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium border border-secondary/20">
            {label}
            <button onClick={onRemove} className="w-3.5 h-3.5 rounded-full hover:bg-secondary/20 transition-colors flex items-center justify-center">
                <X className="w-2.5 h-2.5" />
            </button>
        </span>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ invoice }: { invoice: AdminInvoice }) {
    if (invoice.is_paid) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Paid
            </span>
        );
    }
    // Overdue = unpaid AND strictly previous months (not current month)
    const today = new Date();
    const invoiceMonth = new Date(invoice.month);
    const isCurrentOrFutureMonth =
        invoiceMonth.getFullYear() > today.getFullYear() ||
        (invoiceMonth.getFullYear() === today.getFullYear() && invoiceMonth.getMonth() >= today.getMonth());
    if (invoice.is_overdue && !isCurrentOrFutureMonth) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold">
                <AlertTriangle className="w-3 h-3" />
                Overdue
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Pending
        </span>
    );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant?: 'danger' | 'primary' | 'secondary';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

function ConfirmDialog({ title, message, confirmLabel, confirmVariant = 'danger', onConfirm, onCancel, loading }: ConfirmDialogProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-900/60 dark:bg-neutral-950/80 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
                <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4',
                    confirmVariant === 'danger' 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : confirmVariant === 'secondary'
                            ? 'bg-secondary/10 dark:bg-secondary/20'
                            : 'bg-primary-100 dark:bg-primary-900/30'
                )}>
                    {confirmVariant === 'danger'
                        ? <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        : confirmVariant === 'secondary'
                            ? <AlertCircle className="w-6 h-6 text-secondary" />
                            : <AlertCircle className="w-6 h-6 text-primary" />}
                </div>
                <h3 className="text-base font-bold text-heading text-center mb-2">{title}</h3>
                <p className="text-sm text-body-muted text-center mb-6">{message}</p>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-xl border border-default bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn(
                            'flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50',
                            confirmVariant === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : confirmVariant === 'secondary'
                                    ? 'bg-secondary hover:bg-secondary-dark text-secondary-foreground shadow-sky'
                                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        )}
                    >
                        {loading ? 'Processing…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Generate Invoices Configuration Modal ───────────────────────────────────

interface GenerateInvoicesModalProps {
    courses: { id: number; name: string }[];
    onClose: () => void;
    onConfirm: (params: { course?: number; batch?: number; month_from?: string; month_to?: string }) => void;
    loading: boolean;
}

function GenerateInvoicesModal({ courses, onClose, onConfirm, loading }: GenerateInvoicesModalProps) {
    const today = new Date();
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const defaultFrom = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const defaultTo = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const [monthFrom, setMonthFrom] = useState(defaultFrom);
    const [monthTo, setMonthTo] = useState(defaultTo);
    const [courseId, setCourseId] = useState<number | ''>('');
    const [batchId, setBatchId] = useState<number | ''>('');
    const [batches, setBatches] = useState<{ id: number; name: string }[]>([]);
    const [batchesLoading, setBatchesLoading] = useState(false);

    useEffect(() => {
        setBatchId('');
        if (!courseId) {
            setBatches([]);
            return;
        }
        setBatchesLoading(true);
        adminApi.getBatches({ course: courseId })
            .then(r => {
                const d = r.data.results ?? (r.data as any);
                setBatches(Array.isArray(d) ? d.map((b: any) => ({ id: b.id, name: b.name })) : []);
            })
            .catch(() => setBatches([]))
            .finally(() => setBatchesLoading(false));
    }, [courseId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({
            course: courseId !== '' ? courseId : undefined,
            batch: batchId !== '' ? batchId : undefined,
            month_from: monthFrom ? monthFrom + '-01' : undefined,
            month_to: monthTo ? monthTo + '-01' : undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-default">
                    <div>
                        <h2 className="text-base font-bold text-heading">Generate Invoices</h2>
                        <p className="text-xs text-body-muted">Configure targeted invoice generation</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <X className="w-5 h-5 text-body-muted" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <DropdownSelect
                        label="Course"
                        value={String(courseId)}
                        options={courses}
                        placeholder="All Courses"
                        onSelect={v => setCourseId(v === '' ? '' : Number(v))}
                    />

                    <DropdownSelect
                        label="Batch"
                        value={String(batchId)}
                        options={batches}
                        placeholder={courseId ? 'All Batches' : 'Select course first'}
                        onSelect={v => setBatchId(v === '' ? '' : Number(v))}
                        loading={batchesLoading}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-body-muted mb-1.5">Month From *</label>
                            <input
                                type="month"
                                value={monthFrom}
                                onChange={e => setMonthFrom(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-secondary/20 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-body-muted mb-1.5">Month To *</label>
                            <input
                                type="month"
                                value={monthTo}
                                onChange={e => setMonthTo(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-secondary/20 text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 rounded-xl border border-default bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-dark transition-colors text-sm font-semibold shadow-sky disabled:opacity-60"
                        >
                            {loading ? 'Generating…' : 'Generate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Generate Invoices Result Modal ──────────────────────────────────────────

interface GenerateResultProps {
    result: { message: string; details: Record<string, number>; total_created: number };
    onClose: () => void;
}

function GenerateResultModal({ result, onClose }: GenerateResultProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-900/60 dark:bg-neutral-950/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-heading text-center mb-1">Invoices Generated</h3>
                <p className="text-sm text-body-muted text-center mb-4">{result.message}</p>
                <div className="space-y-2 mb-5">
                    {Object.entries(result.details).map(([month, count]) => (
                        <div key={month} className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/50">
                            <span className="text-sm text-heading font-medium">{month}</span>
                            <span className={cn(
                                'text-sm font-bold',
                                count > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-body-muted'
                            )}>
                                {count} new
                            </span>
                        </div>
                    ))}
                </div>
                <Button onClick={onClose} className="w-full">Done</Button>
            </div>
        </div>
    );
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────

function StatsCards({ filteredStats, globalStats, loading }: { filteredStats: InvoiceStats | null; globalStats: InvoiceStats | null; loading: boolean }) {
    if (loading) {
        return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}</div>;
    }
    if (!filteredStats || !globalStats) return null;

    const cards = [
        {
            label: 'Total', sub: `${filteredStats.total_count} invoices`,
            amount: filteredStats.total_amount,
            icon: Receipt,
            iconBg: 'bg-secondary-100 dark:bg-secondary-900/30',
            iconColor: 'text-secondary',
            badge: null, badgeCls: '',
        },
        {
            label: 'Collected', sub: `${filteredStats.paid_count} paid`,
            amount: filteredStats.paid_amount,
            icon: CheckCheck,
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            badge: null, badgeCls: '',
        },
        {
            label: 'Pending', sub: `${globalStats.pending_count} due this month`,
            amount: globalStats.pending_amount,
            icon: Clock,
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
            badge: null, badgeCls: '',
        },
        {
            label: 'Overdue', sub: `${globalStats.overdue_count} due past months`,
            amount: globalStats.overdue_amount,
            icon: AlertTriangle,
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600 dark:text-red-400',
            badge: null, badgeCls: '',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {cards.map(card => {
                const Icon = card.icon;
                return (
                    <div key={card.label} className="bg-card rounded-2xl border border-default p-4 sm:p-5 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', card.iconBg)}>
                                <Icon className={cn('w-5 h-5', card.iconColor)} />
                            </div>
                            {card.badge && (
                                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', card.badgeCls, (card as any).pulse && 'animate-pulse')}>
                                    {card.badge}
                                </span>
                            )}
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-heading leading-tight">{fmt(card.amount)}</p>
                        <p className="text-xs text-body-muted mt-0.5">{card.sub}</p>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
    invoice: AdminInvoice;
    onClose: () => void;
    onEdit: (inv: AdminInvoice) => void;
    onMarkPaid: (inv: AdminInvoice) => void;
    onMarkUnpaid: (inv: AdminInvoice) => void;
    onDelete: (inv: AdminInvoice) => void;
}

function InvoiceDetailModal({ invoice, onClose, onEdit, onMarkPaid, onMarkUnpaid, onDelete }: DetailModalProps) {
    return (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-card rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between px-6 py-4 border-b border-default z-10">
                    <div>
                        <h2 className="text-base font-bold text-heading">Invoice #{invoice.id}</h2>
                        <p className="text-xs text-body-muted">{invoice.month_display}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge invoice={invoice} />
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                            <X className="w-5 h-5 text-body-muted" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Student */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-4 space-y-2.5">
                        <p className="text-xs font-semibold text-body-muted uppercase tracking-wider">Student</p>
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="font-semibold text-heading text-sm">{invoice.student_name ?? '—'}</p>
                                <p className="text-xs text-body-muted mt-0.5">{invoice.parent_name ?? '—'}</p>
                            </div>
                            {invoice.student_id && (
                                <Link href={`/admin/students/${invoice.student_id}`} onClick={onClose}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-lavender-100 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-300 text-xs font-medium hover:bg-lavender-200 transition-colors shrink-0">
                                    <ExternalLink className="w-3 h-3" />View
                                </Link>
                            )}
                        </div>
                        {invoice.parent_phone && (
                            <a href={`tel:${invoice.parent_phone}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-200 transition-colors">
                                <Phone className="w-3 h-3" />{invoice.parent_phone}
                            </a>
                        )}
                    </div>

                    {/* Course */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-4 space-y-1.5">
                        <p className="text-xs font-semibold text-body-muted uppercase tracking-wider mb-2">Course & Batch</p>
                        {[
                            { label: 'Course', value: invoice.course_name },
                            { label: 'Batch', value: invoice.batch_name },
                        ].map(r => (
                            <div key={r.label} className="flex items-center justify-between">
                                <span className="text-xs text-body-muted">{r.label}</span>
                                <span className="text-sm font-medium text-heading">{r.value ?? '—'}</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-body-muted">Enrollment</span>
                            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                                invoice.enrollment_active
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-body-muted')}>
                                {invoice.enrollment_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    {/* Invoice info */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-4 space-y-1.5">
                        <p className="text-xs font-semibold text-body-muted uppercase tracking-wider mb-2">Invoice</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-body-muted">Month</span>
                            <span className="text-sm font-semibold text-heading">{invoice.month_display}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-body-muted">Amount</span>
                            <span className="text-lg font-bold text-heading">{fmt(invoice.amount)}</span>
                        </div>
                        {invoice.created_at && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-body-muted">Generated</span>
                                <span className="text-xs text-body-muted">{formatDate(invoice.created_at)}</span>
                            </div>
                        )}
                    </div>

                    {/* Payment */}
                    {invoice.is_paid && (invoice.payment_method || invoice.transaction_id) && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Payment</p>
                            {invoice.payment_method && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-body-muted">Method</span>
                                    <span className="text-sm font-semibold text-heading">{invoice.payment_method}</span>
                                </div>
                            )}
                            {invoice.payment_date && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-body-muted">Date</span>
                                    <span className="text-xs text-body-muted">{formatDateTime(invoice.payment_date)}</span>
                                </div>
                            )}
                            {invoice.transaction_id && (
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-xs text-body-muted shrink-0">TXN ID</span>
                                    <span className="text-xs font-mono text-heading truncate">{invoice.transaction_id}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 bg-card border-t border-default px-6 py-4 rounded-b-3xl sm:rounded-b-2xl">
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => onEdit(invoice)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-heading hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />Edit
                        </button>
                        {!invoice.is_paid ? (
                            <button onClick={() => onMarkPaid(invoice)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 transition-colors">
                                <CheckCheck className="w-3.5 h-3.5" />Mark Paid
                            </button>
                        ) : (
                            <button onClick={() => onMarkUnpaid(invoice)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 transition-colors">
                                <Undo2 className="w-3.5 h-3.5" />Mark Unpaid
                            </button>
                        )}
                        {!invoice.is_paid && (
                            <button onClick={() => onDelete(invoice)}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

interface CreateEditModalProps {
    mode: 'create' | 'edit';
    invoice?: AdminInvoice;
    onClose: () => void;
    onSuccess: (inv: AdminInvoice) => void;
}

function CreateEditModal({ mode, invoice, onClose, onSuccess }: CreateEditModalProps) {
    const isEdit = mode === 'edit';
    const [enrollSearch, setEnrollSearch] = useState('');
    const [enrollResults, setEnrollResults] = useState<EnrollmentForSelect[]>([]);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentForSelect | null>(null);
    const [showEnrollDropdown, setShowEnrollDropdown] = useState(false);
    const enrollRef = useRef<HTMLDivElement>(null);

    const [amount, setAmount] = useState(invoice ? Math.round(parseFloat(invoice.amount)).toString() : '');
    const [month, setMonth] = useState(invoice ? isoToMonthInput(invoice.month) : currentMonthInput());
    const [isPaid, setIsPaid] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (enrollRef.current && !enrollRef.current.contains(e.target as Node)) setShowEnrollDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (isEdit) return;
        const t = setTimeout(async () => {
            setEnrollLoading(true);
            try {
                const r = await adminApi.searchEnrollmentsForInvoice(enrollSearch || undefined);
                setEnrollResults(r.data);
                setShowEnrollDropdown(true);
            } catch { setEnrollResults([]); }
            finally { setEnrollLoading(false); }
        }, 300);
        return () => clearTimeout(t);
    }, [enrollSearch, isEdit]);

    useEffect(() => {
        if (selectedEnrollment && !isEdit) setAmount(Math.round(parseFloat(selectedEnrollment.tuition_fee)).toString());
    }, [selectedEnrollment, isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!isEdit && !selectedEnrollment) { setError('Please select an enrollment.'); return; }
        if (amount === '' || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) { setError('Enter a valid amount.'); return; }
        setSubmitting(true);
        try {
            if (isEdit && invoice) {
                const r = await adminApi.updateInvoice(invoice.id, { amount: parseFloat(amount), month: monthInputToIso(month) });
                onSuccess(r.data);
            } else {
                const r = await adminApi.createInvoice({ enrollment: selectedEnrollment!.id, month: monthInputToIso(month), amount: parseFloat(amount), is_paid: isPaid });
                onSuccess(r.data);
            }
        } catch (err: any) {
            const d = err?.response?.data?.error || err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || 'Something went wrong.';
            setError(typeof d === 'string' ? d : JSON.stringify(d));
        } finally { setSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-default">
                    <div>
                        <h2 className="text-base font-bold text-heading">{isEdit ? 'Edit Invoice' : 'Create Invoice'}</h2>
                        {isEdit && invoice && <p className="text-xs text-body-muted">#{invoice.id} · {invoice.student_name}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <X className="w-5 h-5 text-body-muted" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                        </div>
                    )}

                    {!isEdit && (
                        <div ref={enrollRef} className="relative">
                            <label className="block text-sm font-medium text-heading mb-1.5">Student / Enrollment *</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted pointer-events-none" />
                                <input
                                    type="text"
                                    value={selectedEnrollment ? `${selectedEnrollment.student_name} · ${selectedEnrollment.course_name} (${selectedEnrollment.batch_name})` : enrollSearch}
                                    onChange={(e) => { setEnrollSearch(e.target.value); setSelectedEnrollment(null); }}
                                    onFocus={() => enrollResults.length && setShowEnrollDropdown(true)}
                                    placeholder="Search student name…"
                                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-secondary/20 text-sm"
                                />
                                {(selectedEnrollment || enrollSearch) && (
                                    <button type="button" onClick={() => { setSelectedEnrollment(null); setEnrollSearch(''); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted hover:text-heading">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            {showEnrollDropdown && !selectedEnrollment && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-default rounded-xl shadow-lg z-50 overflow-hidden max-h-52 overflow-y-auto animate-slide-down">
                                    {enrollLoading ? <div className="px-4 py-3 text-sm text-body-muted">Searching…</div>
                                        : enrollResults.length === 0 ? <div className="px-4 py-3 text-sm text-body-muted">No active enrollments found</div>
                                            : enrollResults.map(e => (
                                                <button key={e.id} type="button" onClick={() => { setSelectedEnrollment(e); setShowEnrollDropdown(false); }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                                    <p className="text-sm font-semibold text-heading">{e.student_name}</p>
                                                    <p className="text-xs text-body-muted">{e.course_name} · {e.batch_name} · {fmt(e.tuition_fee)}/mo</p>
                                                </button>
                                            ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-heading mb-1.5">Month *</label>
                        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-secondary/20 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1.5">Amount (৳) *</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                            placeholder="e.g. 1500" min="0" step="1"
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-secondary/20 text-sm" required />
                    </div>

                    {!isEdit && (
                        <div onClick={() => setIsPaid(p => !p)} className="flex items-center justify-between gap-3 cursor-pointer p-3 rounded-xl border border-default hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors select-none">
                            <div>
                                <p className="text-sm font-medium text-heading">Mark as paid</p>
                                <p className="text-xs text-body-muted">Creates a manual payment record</p>
                            </div>
                            {/* Sky-colored toggle */}
                            <div className={cn('w-10 h-6 rounded-full relative transition-colors shrink-0', isPaid ? 'bg-secondary' : 'bg-neutral-300 dark:bg-neutral-600')}>
                                <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', isPaid ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        {/* Cancel — same style as Users page modal cancel button */}
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 rounded-xl border border-default bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        {/* Submit — sky color */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-dark transition-colors text-sm font-semibold shadow-sky disabled:opacity-60"
                        >
                            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Invoice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Table Row (Desktop) ──────────────────────────────────────────────────────

function InvoiceRow({ invoice, onClick }: { invoice: AdminInvoice; onClick: () => void }) {
    return (
        <tr onClick={onClick} style={{ contentVisibility: 'auto', containIntrinsicSize: '58px' } as React.CSSProperties} className="border-b border-default hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors cursor-pointer">
            <td className="px-4 py-3">
                <p className="font-semibold text-heading text-sm leading-tight">{invoice.student_name ?? '—'}</p>
                <p className="text-xs text-body-muted mt-0.5">{invoice.parent_phone ?? invoice.parent_name ?? ''}</p>
            </td>
            <td className="px-4 py-3">
                <p className="text-sm font-medium text-heading leading-tight truncate max-w-[160px]">{invoice.course_name ?? '—'}</p>
                <p className="text-xs text-body-muted mt-0.5 truncate max-w-[160px]">{invoice.batch_name ?? ''}</p>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1 text-sm text-heading">
                    <Calendar className="w-3.5 h-3.5 text-body-muted shrink-0" />
                    {invoice.month_display}
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-bold text-heading">{fmt(invoice.amount)}</span>
            </td>
            <td className="px-4 py-3"><StatusBadge invoice={invoice} /></td>
            <td className="px-4 py-3">
                {invoice.payment_method
                    ? <span className="text-xs text-body-muted">{invoice.payment_method}</span>
                    : <span className="text-xs text-body-subtle">—</span>}
            </td>
        </tr>
    );
}

// ─── Card (Mobile) ────────────────────────────────────────────────────────────

function InvoiceCard({ invoice, onClick }: { invoice: AdminInvoice; onClick: () => void }) {
    const today = new Date();
    const invoiceMonth = new Date(invoice.month);
    const isCurrentOrFutureMonth =
        invoiceMonth.getFullYear() > today.getFullYear() ||
        (invoiceMonth.getFullYear() === today.getFullYear() && invoiceMonth.getMonth() >= today.getMonth());
    const isOverdue = invoice.is_overdue && !isCurrentOrFutureMonth;

    return (
        <div onClick={onClick} style={{ contentVisibility: 'auto', containIntrinsicSize: '100px' } as React.CSSProperties} className="p-4 border-b border-default last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                    invoice.is_paid ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400')}>
                    <Receipt className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-heading text-sm leading-tight">{invoice.student_name ?? '—'}</p>
                        <StatusBadge invoice={invoice} />
                    </div>
                    <p className="text-xs text-body-muted truncate">{invoice.course_name ?? '—'} · {invoice.batch_name ?? ''}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-sm font-bold text-heading">{fmt(invoice.amount)}</span>
                        <span className="text-xs text-body-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{invoice.month_display}
                        </span>
                        {invoice.payment_method && <span className="text-xs text-body-muted">{invoice.payment_method}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Dropdown Selector ────────────────────────────────────────────────────────

interface DropdownSelectProps {
    label: string;
    value: string;
    options: { id: number; name: string }[];
    placeholder?: string;
    onSelect: (id: number | '') => void;
    loading?: boolean;
}

function DropdownSelect({ label, value, options, placeholder = 'All', onSelect, loading }: DropdownSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find(o => String(o.id) === value);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div>
            <label className="block text-xs font-medium text-body-muted mb-1.5">{label}</label>
            <div className="relative" ref={ref}>
                <button
                    type="button"
                    onClick={() => setOpen(p => !p)}
                    className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 border border-default rounded-xl bg-input text-sm text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <span className="truncate">{selected?.name ?? placeholder}</span>
                    <div className="flex items-center gap-1 shrink-0">
                        {value && (
                            <span onClick={(e) => { e.stopPropagation(); onSelect(''); }}
                                className="w-4 h-4 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center">
                                <X className="w-2.5 h-2.5" />
                            </span>
                        )}
                        <ChevronDown className="w-3.5 h-3.5 text-body-muted" />
                    </div>
                </button>
                {open && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-default rounded-xl shadow-lg z-50 overflow-hidden max-h-44 overflow-y-auto animate-slide-down">
                        <button type="button" onClick={() => { onSelect(''); setOpen(false); }}
                            className={cn('w-full text-left px-3 py-2 text-sm transition-colors', !value ? 'bg-secondary text-secondary-foreground font-medium' : 'text-body-muted hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
                            {placeholder}
                        </button>
                        {loading ? <div className="px-3 py-2 text-xs text-body-muted">Loading…</div>
                            : options.map(opt => (
                                <button key={opt.id} type="button"
                                    onClick={() => { onSelect(opt.id); setOpen(false); }}
                                    className={cn('w-full text-left px-3 py-2 text-sm transition-colors truncate',
                                        String(opt.id) === value ? 'bg-secondary text-secondary-foreground font-medium' : 'text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
                                    {opt.name}
                                </button>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SortField = '-month' | 'month' | '-amount' | 'amount' | 'student_name' | '-student_name' | '-created_at' | 'created_at';
type PaymentStatus = 'all' | 'paid' | 'unpaid' | 'overdue';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
    { value: '-month', label: 'Month (Newest first)' },
    { value: 'month', label: 'Month (Oldest first)' },
    { value: '-amount', label: 'Amount (High → Low)' },
    { value: 'amount', label: 'Amount (Low → High)' },
    { value: 'student_name', label: 'Student A–Z' },
    { value: '-student_name', label: 'Student Z–A' },
    { value: '-created_at', label: 'Date Added (Newest)' },
    { value: 'created_at', label: 'Date Added (Oldest)' },
];

const STATUS_OPTS: { value: PaymentStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
];

const LIMIT = 50;

export default function AdminInvoicesPage() {
    // Data
    const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
    const [filteredStats, setFilteredStats] = useState<InvoiceStats | null>(null);
    const [globalStats, setGlobalStats] = useState<InvoiceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalCount, setTotalCount] = useState(0);

    // Pagination states
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const observerTargetRef = useRef<HTMLDivElement>(null);

    // Filter dropdown data
    const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
    const [batches, setBatches] = useState<{ id: number; name: string }[]>([]);
    const [parents, setParents] = useState<{ id: number; name: string }[]>([]);
    const [students, setStudents] = useState<{ id: number; name: string }[]>([]);

    // Filters — default to current month
    const thisMonth = currentMonthInput();
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<PaymentStatus>('all');
    const [monthFrom, setMonthFrom] = useState(thisMonth);
    const [monthTo, setMonthTo] = useState(thisMonth);
    const [courseFilter, setCourseFilter] = useState<number | ''>('');
    const [batchFilter, setBatchFilter] = useState<number | ''>('');
    const [parentFilter, setParentFilter] = useState<number | ''>('');
    const [studentFilter, setStudentFilter] = useState<number | ''>('');
    const [showFilters, setShowFilters] = useState(false);

    // Sort
    const [sortField, setSortField] = useState<SortField>('-month');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);

    // Modals
    const [detailInvoice, setDetailInvoice] = useState<AdminInvoice | null>(null);
    const [createModal, setCreateModal] = useState(false);
    const [editInvoice, setEditInvoice] = useState<AdminInvoice | null>(null);

    // Confirmations
    const [confirmMarkPaid, setConfirmMarkPaid] = useState<AdminInvoice | null>(null);
    const [confirmMarkUnpaid, setConfirmMarkUnpaid] = useState<AdminInvoice | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<AdminInvoice | null>(null);
    const [confirmGenerate, setConfirmGenerate] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [generateResult, setGenerateResult] = useState<{ message: string; details: Record<string, number>; total_created: number } | null>(null);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Close sort dropdown outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Reset batch when course changes
    useEffect(() => {
        setBatchFilter('');
        if (!courseFilter) { setBatches([]); return; }
        adminApi.getBatches({ course: Number(courseFilter) })
            .then(r => { const d = r.data.results ?? (r.data as any); setBatches(Array.isArray(d) ? d : []); })
            .catch(() => setBatches([]));
    }, [courseFilter]);

    // Load filter dropdown data once
    useEffect(() => {
        adminApi.getCourses().then(r => {
            const d = r.data.results ?? (r.data as any);
            setCourses(Array.isArray(d) ? d.map((c: any) => ({ id: c.id, name: c.name })) : []);
        }).catch(() => {});
        adminApi.getAllParents().then(r => {
            const d = r.data.results ?? (r.data as any);
            setParents(Array.isArray(d) ? d.map((p: any) => ({ id: p.id, name: `${p.name} (${p.phone})` })) : []);
        }).catch(() => {});
        adminApi.getAllStudents().then(r => {
            const d = r.data.results ?? (r.data as any);
            setStudents(Array.isArray(d) ? d.map((s: any) => ({ id: s.id, name: s.name })) : []);
        }).catch(() => {});
    }, []);

    // Build filter params
    const filterParams = useMemo(() => {
        const p: Record<string, any> = {};
        if (searchQuery) p.search = searchQuery;
        if (monthFrom) p.month_from = monthInputToIso(monthFrom);
        if (monthTo) p.month_to = monthInputToIso(monthTo);
        if (statusFilter === 'paid') p.is_paid = 'true';
        if (statusFilter === 'unpaid') p.is_paid = 'false';
        if (statusFilter === 'overdue') p.overdue = 'true';
        if (courseFilter) p.course = courseFilter;
        if (batchFilter) p.batch = batchFilter;
        if (parentFilter) p.parent = parentFilter;
        if (studentFilter) p.student = studentFilter;
        return p;
    }, [searchQuery, monthFrom, monthTo, statusFilter, courseFilter, batchFilter, parentFilter, studentFilter]);

    const fetchInvoices = useCallback(async (currentOffset: number = 0, append: boolean = false) => {
        if (currentOffset === 0) {
            setOffset(0);
            setLoading(true);
        } else {
            setIsFetchingNextPage(true);
        }
        setError('');
        try {
            const r = await adminApi.getInvoices({
                ...filterParams,
                ordering: sortField,
                offset: currentOffset,
                limit: LIMIT
            });
            const list = Array.isArray(r.data) ? r.data : [];
            
            // Extract total count from response headers
            const totalCountHeader = r.headers?.['x-total-count'];
            const totalCountFromServer = totalCountHeader ? parseInt(totalCountHeader, 10) : list.length;

            setInvoices(prev => {
                const newList = append ? [...prev, ...list] : list;
                setHasMore(newList.length < totalCountFromServer);
                return newList;
            });
            setTotalCount(totalCountFromServer);
        } catch {
            setError('Failed to load invoices.');
        } finally {
            setLoading(false);
            setIsFetchingNextPage(false);
        }
    }, [filterParams, sortField]);

    const loadMore = useCallback(() => {
        if (loading || isFetchingNextPage || !hasMore) return;
        const nextOffset = offset + LIMIT;
        setOffset(nextOffset);
        fetchInvoices(nextOffset, true);
    }, [offset, loading, isFetchingNextPage, hasMore, fetchInvoices]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            // Filtered stats (for Total & Collected cards)
            const r = await adminApi.getInvoiceStats(filterParams);
            setFilteredStats(r.data);
            // Global unfiltered stats (for Pending & Overdue cards — never changes with filters)
            const rGlobal = await adminApi.getInvoiceStats({});
            setGlobalStats(rGlobal.data);
        } catch {}
        finally { setStatsLoading(false); }
    }, [filterParams]);

    // Reset page and fetch on filter/sort change
    useEffect(() => {
        fetchInvoices(0, false);
    }, [filterParams, sortField, fetchInvoices]);

    // Setup intersection observer for infinite scroll
    useEffect(() => {
        const target = observerTargetRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(target);
        return () => {
            if (target) observer.unobserve(target);
        };
    }, [loadMore]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // Active filter chips
    const activeFilters: { key: string; label: string; clear: () => void }[] = [];
    if (searchQuery) activeFilters.push({ key: 'search', label: `"${searchQuery}"`, clear: () => { setSearchInput(''); setSearchQuery(''); } });
    if (statusFilter !== 'all') activeFilters.push({ key: 'status', label: STATUS_OPTS.find(s => s.value === statusFilter)?.label ?? '', clear: () => setStatusFilter('all') });
    if (monthFrom) activeFilters.push({ key: 'from', label: `From ${monthFrom}`, clear: () => setMonthFrom('') });
    if (monthTo) activeFilters.push({ key: 'to', label: `To ${monthTo}`, clear: () => setMonthTo('') });
    if (courseFilter) activeFilters.push({ key: 'course', label: `Course: ${courses.find(c => c.id === courseFilter)?.name ?? courseFilter}`, clear: () => setCourseFilter('') });
    if (batchFilter) activeFilters.push({ key: 'batch', label: `Batch: ${batches.find(b => b.id === batchFilter)?.name ?? batchFilter}`, clear: () => setBatchFilter('') });
    if (parentFilter) activeFilters.push({ key: 'parent', label: `Parent: ${parents.find(p => p.id === parentFilter)?.name ?? parentFilter}`, clear: () => setParentFilter('') });
    if (studentFilter) activeFilters.push({ key: 'student', label: `Student: ${students.find(s => s.id === studentFilter)?.name ?? studentFilter}`, clear: () => setStudentFilter('') });

    const clearAll = () => {
        setSearchInput(''); setSearchQuery('');
        setStatusFilter('all');
        setMonthFrom(''); setMonthTo('');
        setCourseFilter(''); setBatchFilter('');
        setParentFilter(''); setStudentFilter('');
    };

    // Update invoice in list
    const updateInList = (updated: AdminInvoice) => {
        setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
        if (detailInvoice?.id === updated.id) setDetailInvoice(updated);
    };

    // Actions
    const handleMarkPaid = async () => {
        if (!confirmMarkPaid) return;
        setActionLoading(true);
        try {
            const r = await adminApi.markInvoicePaid(confirmMarkPaid.id);
            updateInList(r.data); fetchStats(); setConfirmMarkPaid(null);
        } catch (err: any) { alert(err?.response?.data?.error ?? 'Failed.'); }
        finally { setActionLoading(false); }
    };

    const handleMarkUnpaid = async () => {
        if (!confirmMarkUnpaid) return;
        setActionLoading(true);
        try {
            const r = await adminApi.markInvoiceUnpaid(confirmMarkUnpaid.id);
            updateInList(r.data); fetchStats(); setConfirmMarkUnpaid(null);
        } catch (err: any) { alert(err?.response?.data?.error ?? 'Failed.'); }
        finally { setActionLoading(false); }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setActionLoading(true);
        try {
            await adminApi.deleteInvoice(confirmDelete.id);
            setInvoices(prev => prev.filter(inv => inv.id !== confirmDelete.id));
            setTotalCount(c => c - 1);
            if (detailInvoice?.id === confirmDelete.id) setDetailInvoice(null);
            fetchStats(); setConfirmDelete(null);
        } catch (err: any) { alert(err?.response?.data?.error ?? 'Failed.'); }
        finally { setActionLoading(false); }
    };

    const handleGenerate = async (params: { course?: number; batch?: number; month_from?: string; month_to?: string }) => {
        setActionLoading(true);
        try {
            const r = await adminApi.generateInvoices(params);
            setGenerateResult(r.data);
            setConfirmGenerate(false);
            fetchInvoices(0, false); fetchStats();
        } catch (err: any) { alert(err?.response?.data?.error ?? 'Failed to generate invoices.'); }
        finally { setActionLoading(false); }
    };

    const openEdit = (inv: AdminInvoice) => { setDetailInvoice(null); setEditInvoice(inv); };
    const openMarkPaid = (inv: AdminInvoice) => { setDetailInvoice(null); setConfirmMarkPaid(inv); };
    const openMarkUnpaid = (inv: AdminInvoice) => { setDetailInvoice(null); setConfirmMarkUnpaid(inv); };
    const openDelete = (inv: AdminInvoice) => { setDetailInvoice(null); setConfirmDelete(inv); };

    const sortLabel = SORT_OPTIONS.find(s => s.value === sortField)?.label ?? 'Sort';

    return (
        <div className="space-y-4 sm:space-y-5">

            {/* Stats */}
            <StatsCards filteredStats={filteredStats} globalStats={globalStats} loading={statsLoading} />

            {/* Main card */}
            <div className="bg-card rounded-2xl border border-default shadow-sm overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-default space-y-3">

                    {/* Row 1 */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder="Search student or parent phone…"
                                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-secondary/20 text-sm"
                            />
                            {searchInput && (
                                <button onClick={() => { setSearchInput(''); setSearchQuery(''); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted hover:text-heading transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {/* Sort */}
                            <div className="relative" ref={sortRef}>
                                <button onClick={() => setShowSortDropdown(p => !p)}
                                    className="inline-flex items-center gap-2 px-3 py-2.5 border border-default rounded-xl bg-input text-sm font-medium text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                    <ArrowUpDown className="w-4 h-4 text-body-muted" />
                                    <span className="hidden sm:inline truncate max-w-[110px]">{sortLabel}</span>
                                </button>
                                {showSortDropdown && (
                                    <div className="absolute right-0 top-full mt-1 bg-card border border-default rounded-xl shadow-lg z-50 overflow-hidden min-w-[200px] animate-slide-down">
                                        {SORT_OPTIONS.map(opt => (
                                            <button key={opt.value} onClick={() => { setSortField(opt.value); setShowSortDropdown(false); }}
                                                className={cn('w-full text-left px-4 py-2.5 text-sm transition-colors',
                                                    sortField === opt.value ? 'bg-secondary text-secondary-foreground font-medium' : 'text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Filter toggle */}
                            <button onClick={() => setShowFilters(p => !p)}
                                className={cn('inline-flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors',
                                    showFilters || activeFilters.length > 0
                                        ? 'border-secondary bg-secondary/10 text-secondary'
                                        : 'border-default bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Filters</span>
                                {activeFilters.length > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center">
                                        {activeFilters.length}
                                    </span>
                                )}
                            </button>

                            {/* Refresh */}
                            <button onClick={() => { fetchInvoices(0, false); fetchStats(); }}
                                className="p-2.5 border border-default rounded-xl bg-input text-body-muted hover:text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" title="Refresh">
                                <RefreshCw className="w-4 h-4" />
                            </button>

                            {/* Generate invoices */}
                            <button onClick={() => setConfirmGenerate(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-secondary/40 rounded-xl bg-secondary/10 text-secondary text-sm font-medium hover:bg-secondary/20 transition-colors shrink-0"
                                title="Generate invoices for current & previous month">
                                <Zap className="w-4 h-4" />
                                <span className="hidden sm:inline">Generate</span>
                            </button>

                            {/* Create — sky color, same height py-2.5 as neighboring buttons */}
                            <button
                                onClick={() => setCreateModal(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary-dark transition-colors shrink-0 shadow-sky"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Create</span>
                            </button>
                        </div>
                    </div>

                    {/* Expanded filters */}
                    {showFilters && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1 animate-slide-down">
                            {/* Status */}
                            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                                <label className="block text-xs font-medium text-body-muted mb-1.5">Status</label>
                                <div className="inline-flex rounded-xl border border-default bg-input p-1 gap-0.5">
                                    {STATUS_OPTS.map(opt => (
                                        <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
                                            className={cn('px-3 py-1 text-xs font-medium rounded-lg transition-colors',
                                                statusFilter === opt.value
                                                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                                                    : 'text-body-muted hover:text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Month from */}
                            <div>
                                <label className="block text-xs font-medium text-body-muted mb-1.5">Month From</label>
                                <input type="month" value={monthFrom} onChange={e => setMonthFrom(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-default bg-input text-sm focus:ring-2 focus:ring-secondary/20" />
                            </div>

                            {/* Month to */}
                            <div>
                                <label className="block text-xs font-medium text-body-muted mb-1.5">Month To</label>
                                <input type="month" value={monthTo} onChange={e => setMonthTo(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-default bg-input text-sm focus:ring-2 focus:ring-secondary/20" />
                            </div>

                            {/* Course */}
                            <DropdownSelect label="Course" value={String(courseFilter)} options={courses}
                                placeholder="All Courses" onSelect={v => setCourseFilter(v === '' ? '' : Number(v))} />

                            {/* Batch */}
                            <DropdownSelect label="Batch" value={String(batchFilter)} options={batches}
                                placeholder={courseFilter ? 'All Batches' : 'Select course first'} onSelect={v => setBatchFilter(v === '' ? '' : Number(v))} />

                            {/* Parent */}
                            <DropdownSelect label="Parent" value={String(parentFilter)} options={parents}
                                placeholder="All Parents" onSelect={v => setParentFilter(v === '' ? '' : Number(v))} />

                            {/* Student */}
                            <DropdownSelect label="Student" value={String(studentFilter)} options={students}
                                placeholder="All Students" onSelect={v => setStudentFilter(v === '' ? '' : Number(v))} />
                        </div>
                    )}

                    {/* Active chips */}
                    {activeFilters.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                            {activeFilters.map(f => <FilterChip key={f.key} label={f.label} onRemove={f.clear} />)}
                            <button onClick={clearAll} className="text-xs text-body-muted hover:text-heading transition-colors underline underline-offset-2">
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Count bar */}
                {!loading && (
                    <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/30 border-b border-default">
                        <p className="text-xs text-body-muted">
                            {totalCount === 0 ? 'No invoices found' : `${totalCount} invoice${totalCount !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="m-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                        <button onClick={() => { fetchInvoices(0, false); fetchStats(); }} className="ml-auto underline text-xs">Retry</button>
                    </div>
                )}

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-default bg-neutral-50 dark:bg-neutral-900/30">
                                {['Student', 'Course / Batch', 'Month', 'Amount', 'Status', 'Method'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)
                                : invoices.length === 0
                                    ? <tr><td colSpan={6} className="px-4 py-16 text-center">
                                        <Receipt className="w-10 h-10 mx-auto mb-3 text-body-subtle opacity-40" />
                                        <p className="text-body-muted text-sm">No invoices found</p>
                                        <p className="text-body-subtle text-xs mt-1">Try adjusting your filters</p>
                                    </td></tr>
                                    : invoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} onClick={() => setDetailInvoice(inv)} />)
                            }
                            {!loading && isFetchingNextPage && Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={`next-skele-${i}`} />)}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                        : invoices.length === 0
                            ? <div className="py-16 text-center">
                                <Receipt className="w-10 h-10 mx-auto mb-3 text-body-subtle opacity-40" />
                                <p className="text-body-muted text-sm">No invoices found</p>
                                <p className="text-body-subtle text-xs mt-1">Try adjusting your filters</p>
                            </div>
                            : invoices.map(inv => <InvoiceCard key={inv.id} invoice={inv} onClick={() => setDetailInvoice(inv)} />)
                    }
                    {!loading && isFetchingNextPage && Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={`next-card-skele-${i}`} />)}
                </div>

                {/* Infinite scroll trigger */}
                {hasMore && !loading && (
                    <div ref={observerTargetRef} className="h-4 w-full" />
                )}
            </div>

            {/* Modals */}
            {detailInvoice && (
                <InvoiceDetailModal invoice={detailInvoice} onClose={() => setDetailInvoice(null)}
                    onEdit={openEdit} onMarkPaid={openMarkPaid} onMarkUnpaid={openMarkUnpaid} onDelete={openDelete} />
            )}
            {createModal && (
                <CreateEditModal mode="create" onClose={() => setCreateModal(false)}
                    onSuccess={inv => { setInvoices(p => [inv, ...p]); setTotalCount(c => c + 1); fetchStats(); setCreateModal(false); }} />
            )}
            {editInvoice && (
                <CreateEditModal mode="edit" invoice={editInvoice} onClose={() => setEditInvoice(null)}
                    onSuccess={inv => { updateInList(inv); fetchStats(); setEditInvoice(null); }} />
            )}

            {/* Confirmations */}
            {confirmGenerate && (
                <GenerateInvoicesModal
                    courses={courses}
                    onClose={() => setConfirmGenerate(false)}
                    onConfirm={handleGenerate}
                    loading={actionLoading}
                />
            )}
            {confirmMarkPaid && (
                <ConfirmDialog
                    title="Mark as Paid?"
                    message={`Creates a manual payment record for ${confirmMarkPaid.student_name}'s ${confirmMarkPaid.month_display} invoice (${fmt(confirmMarkPaid.amount)}).`}
                    confirmLabel="Mark Paid"
                    confirmVariant="secondary"
                    onConfirm={handleMarkPaid}
                    onCancel={() => setConfirmMarkPaid(null)}
                    loading={actionLoading}
                />
            )}
            {confirmMarkUnpaid && (
                <ConfirmDialog
                    title="Mark as Unpaid?"
                    message={`Existing payments for ${confirmMarkUnpaid.student_name}'s ${confirmMarkUnpaid.month_display} invoice will be marked as failed.`}
                    confirmLabel="Mark Unpaid"
                    confirmVariant="danger"
                    onConfirm={handleMarkUnpaid}
                    onCancel={() => setConfirmMarkUnpaid(null)}
                    loading={actionLoading}
                />
            )}
            {confirmDelete && (
                <ConfirmDialog
                    title="Delete Invoice?"
                    message={`Permanently delete invoice #${confirmDelete.id} for ${confirmDelete.student_name} (${confirmDelete.month_display}, ${fmt(confirmDelete.amount)}). Cannot be undone.`}
                    confirmLabel="Delete"
                    confirmVariant="danger"
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDelete(null)}
                    loading={actionLoading}
                />
            )}
            {generateResult && (
                <GenerateResultModal result={generateResult} onClose={() => setGenerateResult(null)} />
            )}
        </div>
    );
}
