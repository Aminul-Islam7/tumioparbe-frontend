'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
    Ticket,
    Plus,
    CheckCircle2,
    XCircle,
    Calendar,
    AlertCircle,
    Pencil,
    Trash2,
    X,
    ChevronDown
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';
import { Coupon, Course } from '@/types';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: string | number | null): string {
    if (amount === null || amount === undefined) return '৳0';
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(n)) return '৳0';
    return '৳' + Math.round(n).toLocaleString('en-IN');
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'No Expiry';
    return new Date(dateStr).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateInput(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ─── Reusable iOS Toggle Switch ────────────────────────────────────────────────

interface ToggleSwitchProps {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onChange();
            }}
            disabled={disabled}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={cn(
                'relative inline-flex shrink-0 h-6 w-11 items-center rounded-full transition-colors duration-200 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                checked ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-600'
            )}
        >
            <span
                className={cn(
                    'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md ring-0 transition-transform duration-200',
                    checked ? 'translate-x-6' : 'translate-x-1'
                )}
            />
        </button>
    );
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function CardSkeleton() {
    return (
        <div className="bg-card rounded-2xl border border-default p-5 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-7 w-28 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
                <div className="h-6 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
            </div>
            <div className="space-y-2">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
            </div>
            <div className="pt-3 border-t border-default flex gap-2">
                <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
                <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
        </div>
    );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant?: 'danger' | 'amber' | 'secondary';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

function ConfirmDialog({ title, message, confirmLabel, confirmVariant = 'amber', onConfirm, onCancel, loading }: ConfirmDialogProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-900/60 dark:bg-neutral-950/80 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
                <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4',
                    confirmVariant === 'danger' 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : 'bg-amber-100 dark:bg-amber-900/30'
                )}>
                    {confirmVariant === 'danger'
                        ? <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                        : <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
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
                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                        )}
                    >
                        {loading ? 'Processing…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Toast Notification ──────────────────────────────────────────────────────

interface ToastProps {
    message: string;
    variant: 'success' | 'error';
    onDismiss: () => void;
}

function Toast({ message, variant, onDismiss }: ToastProps) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        timerRef.current = setTimeout(onDismiss, 3500);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [onDismiss]);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] animate-slide-up">
            <div className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-semibold max-w-sm',
                variant === 'success'
                    ? 'bg-emerald-600 border-emerald-700 text-white'
                    : 'bg-red-600 border-red-700 text-white'
            )}>
                {variant === 'success'
                    ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                    : <XCircle className="w-4 h-4 shrink-0" />}
                <span>{message}</span>
                <button onClick={onDismiss} className="ml-auto opacity-80 hover:opacity-100">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ─── Create / Edit Coupon Modal ────────────────────────────────────────────────

interface CouponFormModalProps {
    coupon?: Coupon | null; // Null means create mode
    courses: { id: number; name: string }[];
    onClose: () => void;
    onSuccess: (message: string) => void;
}

function CouponFormModal({ coupon, courses, onClose, onSuccess }: CouponFormModalProps) {
    const isEdit = !!coupon;
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form fields
    const [code, setCode] = useState(coupon?.code || '');
    const [description, setDescription] = useState(coupon?.description || '');
    const [offerMessage, setOfferMessage] = useState(coupon?.offer_message || '');
    const [selectedCourse, setSelectedCourse] = useState<number | ''>(coupon?.course || '');
    const [isPublic, setIsPublic] = useState(coupon ? coupon.is_public : false);
    const [isActive, setIsActive] = useState(coupon ? coupon.is_active : true);
    const [expiresAt, setExpiresAt] = useState(coupon?.expires_at ? formatDateInput(coupon.expires_at) : '');

    // Custom Dropdown States
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);
    const courseDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (courseDropdownRef.current && !courseDropdownRef.current.contains(e.target as Node)) {
                setShowCourseDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Discounts
    const [admissionDiscount, setAdmissionDiscount] = useState(coupon ? String(Math.round(coupon.admission_fee_discount)) : '0');
    const [tuitionDiscount, setTuitionDiscount] = useState(coupon ? String(Math.round(coupon.tuition_fee_discount)) : '0');
    const [firstMonthDiscount, setFirstMonthDiscount] = useState(coupon ? String(Math.round(coupon.first_month_discount)) : '0');

    const courseOptions = useMemo(() => courses.map(c => ({ id: c.id, name: c.name })), [courses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!code.trim()) {
            setError('Coupon code is required.');
            return;
        }

        const admD = parseFloat(admissionDiscount) || 0;
        const tuiD = parseFloat(tuitionDiscount) || 0;
        const fstD = parseFloat(firstMonthDiscount) || 0;

        if (admD === 0 && tuiD === 0 && fstD === 0) {
            setError('At least one discount amount must be greater than 0.');
            return;
        }

        if (admD < 0 || tuiD < 0 || fstD < 0) {
            setError('Discount amounts cannot be negative.');
            return;
        }

        setSubmitting(true);

        const data: Partial<Coupon> = {
            code: code.toUpperCase().trim(),
            description: description.trim(),
            offer_message: offerMessage.trim(),
            course: selectedCourse === '' ? undefined : selectedCourse,
            is_public: isPublic,
            is_active: isActive,
            expires_at: expiresAt ? new Date(expiresAt + 'T00:00:00').toISOString() : null,
            admission_fee_discount: admD,
            tuition_fee_discount: tuiD,
            first_month_discount: fstD
        };

        try {
            if (isEdit && coupon) {
                await adminApi.updateCoupon(coupon.id, data);
                onSuccess('Coupon updated successfully!');
            } else {
                await adminApi.createCoupon(data);
                onSuccess('Coupon created successfully!');
            }
        } catch (err: any) {
            const d = err?.response?.data;
            if (d && typeof d === 'object') {
                const msgs = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ');
                setError(msgs || 'Failed to save coupon.');
            } else {
                setError(err?.response?.data?.error || err?.response?.data?.detail || 'An error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg animate-slide-up sm:animate-scale-in max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-default shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-heading">{isEdit ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                        <p className="text-xs text-body-muted">{isEdit ? `Modifying coupon: ${coupon?.code}` : 'Add a new promotional or system discount'}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <X className="w-5 h-5 text-body-muted" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Code & Course row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-heading mb-1.5">Coupon Code *</label>
                            <input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="e.g. SUMMER50"
                                className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-amber-500/20 text-sm font-bold uppercase tracking-wider focus:border-amber-500 outline-none"
                                required
                                maxLength={20}
                                disabled={isEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-heading mb-1.5">Applies To Course</label>
                            <div className="relative" ref={courseDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowCourseDropdown(p => !p)}
                                    className="w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 border border-default rounded-xl bg-input text-sm text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-left"
                                >
                                    <span className="truncate">
                                        {selectedCourse === '' ? 'All Courses' : (courseOptions.find(c => c.id === selectedCourse)?.name || 'All Courses')}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-body-muted shrink-0" />
                                </button>
                                {showCourseDropdown && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-default rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto animate-slide-down">
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedCourse(''); setShowCourseDropdown(false); }}
                                            className={cn(
                                                'w-full text-left px-4 py-2.5 text-sm transition-colors truncate',
                                                selectedCourse === ''
                                                    ? 'bg-amber-500 text-white font-medium'
                                                    : 'text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                            )}
                                        >
                                            All Courses
                                        </button>
                                        {courseOptions.map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => { setSelectedCourse(opt.id); setShowCourseDropdown(false); }}
                                                className={cn(
                                                    'w-full text-left px-4 py-2.5 text-sm transition-colors truncate',
                                                    selectedCourse === opt.id
                                                        ? 'bg-amber-500 text-white font-medium'
                                                        : 'text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                                )}
                                            >
                                                {opt.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Messages & Description */}
                    <div>
                        <label className="block text-sm font-semibold text-heading mb-1.5">Offer Message (Shown to users)</label>
                        <input
                            type="text"
                            value={offerMessage}
                            onChange={e => setOfferMessage(e.target.value)}
                            placeholder="e.g. 50% Off Admission Fee!"
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-amber-500/20 text-sm focus:border-amber-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-heading mb-1.5">Description (Internal Admin Notes)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Internal reference details, campaign purpose, etc."
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-amber-500/20 text-sm focus:border-amber-500 outline-none resize-none"
                        />
                    </div>

                    {/* Discount Amounts */}
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Discount Amounts (৳)</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-2xs font-medium text-body-muted mb-1">Admission Fee</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body-muted text-xs">৳</span>
                                    <input
                                        type="number"
                                        value={admissionDiscount}
                                        onChange={e => setAdmissionDiscount(e.target.value)}
                                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-default bg-input focus:ring-2 focus:ring-amber-500/20 text-sm focus:border-amber-500 outline-none"
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-2xs font-medium text-body-muted mb-1">Tuition (Monthly)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body-muted text-xs">৳</span>
                                    <input
                                        type="number"
                                        value={tuitionDiscount}
                                        onChange={e => setTuitionDiscount(e.target.value)}
                                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-default bg-input focus:ring-2 focus:ring-amber-500/20 text-sm focus:border-amber-500 outline-none"
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-2xs font-medium text-body-muted mb-1">First Month Add-on</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body-muted text-xs">৳</span>
                                    <input
                                        type="number"
                                        value={firstMonthDiscount}
                                        onChange={e => setFirstMonthDiscount(e.target.value)}
                                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-default bg-input focus:ring-2 focus:ring-amber-500/20 text-sm focus:border-amber-500 outline-none"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expiry & Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div>
                            <label className="block text-sm font-semibold text-heading mb-1.5">Expires At (Optional)</label>
                            <input
                                type="date"
                                value={expiresAt}
                                onChange={e => setExpiresAt(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-amber-500/20 text-sm focus:border-amber-500 outline-none"
                            />
                        </div>

                        <div className="flex flex-col justify-around gap-2.5">
                            <div className="flex items-center justify-between p-2.5 border border-default rounded-xl bg-input">
                                <div>
                                    <p className="text-xs font-bold text-heading">Public Visible</p>
                                    <p className="text-[10px] text-body-muted">Show in list during checkout</p>
                                </div>
                                <ToggleSwitch
                                    checked={isPublic}
                                    onChange={() => setIsPublic(!isPublic)}
                                />
                            </div>

                            <div className="flex items-center justify-between p-2.5 border border-default rounded-xl bg-input">
                                <div>
                                    <p className="text-xs font-bold text-heading">Active Status</p>
                                    <p className="text-[10px] text-body-muted">Allows this coupon to be verified</p>
                                </div>
                                <ToggleSwitch
                                    checked={isActive}
                                    onChange={() => setIsActive(!isActive)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-default">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-default bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors text-sm font-semibold shadow-md shadow-amber-500/10 disabled:opacity-60"
                        >
                            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Coupon'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Coupon Details Modal ─────────────────────────────────────────────────────

interface CouponDetailModalProps {
    coupon: Coupon;
    onClose: () => void;
    onEdit: () => void;
}

function CouponDetailModal({ coupon, onClose, onEdit }: CouponDetailModalProps) {
    const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;
    const isValid = coupon.is_active && !isExpired;

    return (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md animate-slide-up sm:animate-scale-in max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-default shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-heading">Coupon Details</h2>
                        <p className="text-xs text-body-muted">Code reference ID #{coupon.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                        ) : isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold">
                                <XCircle className="w-3 h-3" /> Expired
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
                                <XCircle className="w-3 h-3" /> Inactive
                            </span>
                        )}
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                            <X className="w-5 h-5 text-body-muted" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Header profile style */}
                    <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
                            <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-sm font-black font-mono border border-amber-200/50 mb-1">
                                {coupon.code}
                            </span>
                            <p className="text-xs text-body-muted">Visibility: {coupon.is_public ? 'Public' : 'Private'}</p>
                        </div>
                    </div>

                    {/* Benefits Card */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-4 space-y-3.5">
                        <p className="text-xs font-bold text-body-muted uppercase tracking-wider">Discount Package Benefits</p>
                        
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-body-muted">Admission Fee Discount</span>
                                <span className="text-sm font-bold text-heading">{fmt(coupon.admission_fee_discount)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-body-muted">Tuition (Monthly) Discount</span>
                                <span className="text-sm font-bold text-heading">{fmt(coupon.tuition_fee_discount)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-body-muted">First Month stackable discount</span>
                                <span className="text-sm font-bold text-heading">{fmt(coupon.first_month_discount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Details Card */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-4 space-y-2.5">
                        <p className="text-xs font-bold text-body-muted uppercase tracking-wider">Coupon Configuration</p>
                        
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-body-muted">Applies to Course</span>
                            <span className="font-semibold text-heading text-right max-w-[200px] truncate">
                                {coupon.course_name || 'All Courses'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-body-muted">Expiry Deadline</span>
                            <span className="font-semibold text-heading flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-body-muted" />
                                {formatDate(coupon.expires_at)}
                            </span>
                        </div>
                        {coupon.offer_message && (
                            <div className="pt-1.5 border-t border-default">
                                <span className="block text-[10px] text-body-muted uppercase font-bold mb-0.5">Offer Checkout Message</span>
                                <p className="text-xs font-medium text-heading bg-card p-2 rounded-lg border border-default">
                                    &ldquo;{coupon.offer_message}&rdquo;
                                </p>
                            </div>
                        )}
                        {coupon.description && (
                            <div className="pt-1.5 border-t border-default">
                                <span className="block text-[10px] text-body-muted uppercase font-bold mb-0.5">Internal Admin Notes</span>
                                <p className="text-xs text-body-muted whitespace-pre-wrap bg-card p-2 rounded-lg border border-default">
                                    {coupon.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-default bg-neutral-50/50 dark:bg-neutral-900/20 rounded-b-3xl sm:rounded-b-2xl shrink-0">
                    <button
                        onClick={() => {
                            onEdit();
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/10 transition-colors"
                    >
                        <Pencil className="w-4 h-4" /> Edit Coupon Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Admin Coupon Page Component ─────────────────────────────────────────

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [deleteCouponId, setDeleteCouponId] = useState<number | null>(null);
    const [submittingToggle, setSubmittingToggle] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Toast notification
    const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
    const showToast = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
        setToast({ message, variant });
    }, []);
    const dismissToast = useCallback(() => setToast(null), []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [couponsRes, coursesRes] = await Promise.all([
                adminApi.getCoupons(),
                adminApi.getCourses()
            ]);

            const couponList = couponsRes.data?.results ?? (couponsRes.data as any);
            const courseList = coursesRes.data?.results ?? (coursesRes.data as any);

            setCoupons(Array.isArray(couponList) ? couponList : []);
            setCourses(Array.isArray(courseList) ? courseList : []);
        } catch (err) {
            console.error('Error fetching admin coupon lists:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle single deletion
    const handleDelete = async () => {
        if (!deleteCouponId) return;
        setDeleting(true);
        try {
            await adminApi.deleteCoupon(deleteCouponId);
            setCoupons(prev => prev.filter(c => c.id !== deleteCouponId));
            setDeleteCouponId(null);
            showToast('Coupon deleted successfully.');
        } catch (err: any) {
            showToast(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to delete coupon.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    // Toggle active status
    const handleToggleActive = async (c: Coupon) => {
        setSubmittingToggle(c.id);
        try {
            const updatedActive = !c.is_active;
            await adminApi.updateCoupon(c.id, { 
                is_active: updatedActive,
                admission_fee_discount: c.admission_fee_discount,
                tuition_fee_discount: c.tuition_fee_discount,
                first_month_discount: c.first_month_discount
            });
            setCoupons(prev => prev.map(item => item.id === c.id ? { ...item, is_active: updatedActive } : item));
        } catch (err: any) {
            showToast(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to toggle activation.', 'error');
        } finally {
            setSubmittingToggle(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">

            {/* Coupons Grid Card List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
                    {coupons.map((c) => {
                        const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
                        const isValid = c.is_active && !isExpired;

                        return (
                            <div 
                                key={c.id}
                                onClick={() => {
                                    setSelectedCoupon(c);
                                    setShowDetailModal(true);
                                }}
                                className="bg-card rounded-2xl border border-default p-5 space-y-4 hover:border-amber-500/20 transition-all cursor-pointer shadow-sm relative flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    {/* Header Row */}
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="inline-block px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-black font-mono border border-amber-250/30 shadow-sm leading-none">
                                            {c.code}
                                        </span>
                                        
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <ToggleSwitch
                                                checked={c.is_active}
                                                onChange={() => handleToggleActive(c)}
                                                disabled={submittingToggle === c.id}
                                            />
                                        </div>
                                    </div>

                                    {/* Expiry / Validity Badges */}
                                    <div className="flex items-center gap-2">
                                        {isValid ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                                Valid
                                            </span>
                                        ) : isExpired ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-[10px] font-bold">
                                                Expired
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] font-bold">
                                                Inactive
                                            </span>
                                        )}
                                        {c.is_public ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                                                Public
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] font-bold">
                                                Private
                                            </span>
                                        )}
                                    </div>

                                    {/* Content Column */}
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-heading truncate">
                                            Applies to: <span className="font-bold text-amber-600 dark:text-amber-400">{c.course_name || 'All Courses'}</span>
                                        </p>
                                        {c.offer_message && (
                                            <p className="text-xs text-body-muted line-clamp-1">
                                                &ldquo;{c.offer_message}&rdquo;
                                            </p>
                                        )}
                                    </div>

                                    {/* Discount breakdown grid */}
                                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                                        <div className={cn(
                                            'flex flex-col items-center justify-center rounded-xl py-2 px-1.5 border',
                                            c.admission_fee_discount > 0
                                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-800/40'
                                                : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/50 dark:border-neutral-700/50 opacity-40'
                                        )}>
                                            <span className="text-[9px] font-semibold text-body-muted uppercase tracking-wide leading-tight mb-0.5">Admission</span>
                                            <span className={cn(
                                                'text-xs font-black leading-tight',
                                                c.admission_fee_discount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-body-muted'
                                            )}>
                                                {c.admission_fee_discount > 0 ? fmt(c.admission_fee_discount) : '—'}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            'flex flex-col items-center justify-center rounded-xl py-2 px-1.5 border',
                                            c.tuition_fee_discount > 0
                                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-800/40'
                                                : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/50 dark:border-neutral-700/50 opacity-40'
                                        )}>
                                            <span className="text-[9px] font-semibold text-body-muted uppercase tracking-wide leading-tight mb-0.5">Tuition/mo</span>
                                            <span className={cn(
                                                'text-xs font-black leading-tight',
                                                c.tuition_fee_discount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-body-muted'
                                            )}>
                                                {c.tuition_fee_discount > 0 ? fmt(c.tuition_fee_discount) : '—'}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            'flex flex-col items-center justify-center rounded-xl py-2 px-1.5 border',
                                            c.first_month_discount > 0
                                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-800/40'
                                                : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/50 dark:border-neutral-700/50 opacity-40'
                                        )}>
                                            <span className="text-[9px] font-semibold text-body-muted uppercase tracking-wide leading-tight mb-0.5">1st Month</span>
                                            <span className={cn(
                                                'text-xs font-black leading-tight',
                                                c.first_month_discount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-body-muted'
                                            )}>
                                                {c.first_month_discount > 0 ? fmt(c.first_month_discount) : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer details */}
                                <div className="flex items-center justify-between text-2xs text-body-muted border-t border-default pt-3 mt-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-GB') : 'No Expiry'}
                                    </span>
                                    
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <button 
                                            onClick={() => {
                                                setSelectedCoupon(c);
                                                setShowFormModal(true);
                                            }}
                                            className="p-1.5 text-body-muted hover:text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded-lg"
                                            title="Edit coupon"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        
                                        <button 
                                            onClick={() => setDeleteCouponId(c.id)}
                                            className="p-1.5 text-body-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors rounded-lg"
                                            title="Delete coupon"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Coupon Card */}
                    <div
                        onClick={() => {
                            setSelectedCoupon(null);
                            setShowFormModal(true);
                        }}
                        className="bg-card rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-900/50 overflow-hidden flex flex-col items-center justify-center text-center p-6 hover:border-amber-500 hover:bg-amber-500/5 transition-all duration-300 cursor-pointer min-h-[220px] group shadow-sm"
                    >
                        <div className="h-14 w-14 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="h-7 w-7 text-amber-500" />
                        </div>
                        <h3 className="text-base font-bold text-heading mb-1">Create Coupon</h3>
                        <p className="text-xs text-body-muted">
                            Click here to add a new discount
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Render Form Modal ─────────────────────────────────────────────── */}
            {showFormModal && (
                <CouponFormModal
                    coupon={selectedCoupon}
                    courses={courses}
                    onClose={() => {
                        setShowFormModal(false);
                        setSelectedCoupon(null);
                    }}
                    onSuccess={(msg) => {
                        setShowFormModal(false);
                        setSelectedCoupon(null);
                        showToast(msg);
                        loadData();
                    }}
                />
            )}

            {/* ─── Render Detail Modal ───────────────────────────────────────────── */}
            {showDetailModal && selectedCoupon && (
                <CouponDetailModal
                    coupon={selectedCoupon}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedCoupon(null);
                    }}
                    onEdit={() => {
                        setShowDetailModal(false);
                        setShowFormModal(true);
                    }}
                />
            )}

            {/* ─── Render Delete Confirm Dialog ──────────────────────────────────── */}
            {deleteCouponId && (
                <ConfirmDialog
                    title="Delete Coupon?"
                    message="This operation cannot be reversed. Active enrollments or payments already using this coupon will keep their historic benefit, but new uses will fail."
                    confirmLabel="Delete Coupon"
                    confirmVariant="danger"
                    loading={deleting}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteCouponId(null)}
                />
            )}

            {/* ─── Toast ────────────────────────────────────────────────────────── */}
            {toast && (
                <Toast
                    message={toast.message}
                    variant={toast.variant}
                    onDismiss={dismissToast}
                />
            )}
        </div>
    );
}
