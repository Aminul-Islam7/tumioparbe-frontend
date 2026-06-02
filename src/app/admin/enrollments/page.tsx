'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
    GraduationCap,
    Search,
    X,
    Filter,
    ArrowUpDown,
    RefreshCw,
    Plus,
    CheckCircle2,
    XCircle,
    User,
    Calendar,
    ExternalLink,
    AlertCircle,
    ChevronDown,
    Zap,
    DollarSign,
    Pencil,
    Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi, AdminEnrollmentDetails } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: string | number | null): string {
    if (amount === null) return 'Default';
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(n)) return '৳0';
    return '৳' + Math.round(n).toLocaleString('en-IN');
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMonth(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
            {[40, 25, 15, 10, 10].map((w, i) => (
                <td key={i} className="px-4 py-4">
                    <div className="animate-skeleton h-4 rounded-lg" style={{ width: `${w}%` }} />
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
            {label}
            <button onClick={onRemove} className="w-3.5 h-3.5 rounded-full hover:bg-primary/20 transition-colors flex items-center justify-center">
                <X className="w-2.5 h-2.5" />
            </button>
        </span>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
    if (active) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Active
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
            <XCircle className="w-3 h-3" />
            Inactive
        </span>
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
                            className={cn('w-full text-left px-3 py-2 text-sm transition-colors', !value ? 'bg-primary text-primary-foreground font-medium' : 'text-body-muted hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
                            {placeholder}
                        </button>
                        {loading ? <div className="px-3 py-2 text-xs text-body-muted">Loading…</div>
                            : options.map(opt => (
                                <button key={opt.id} type="button"
                                    onClick={() => { onSelect(opt.id); setOpen(false); }}
                                    className={cn('w-full text-left px-3 py-2 text-sm transition-colors truncate',
                                        String(opt.id) === value ? 'bg-primary text-primary-foreground font-medium' : 'text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
                                    {opt.name}
                                </button>
                            ))}
                    </div>
                )}
            </div>
        </div>
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

function ConfirmDialog({ title, message, confirmLabel, confirmVariant = 'primary', onConfirm, onCancel, loading }: ConfirmDialogProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-900/60 dark:bg-neutral-950/80 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
                <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4',
                    confirmVariant === 'danger' 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : 'bg-primary-100 dark:bg-primary-900/30'
                )}>
                    {confirmVariant === 'danger'
                        ? <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
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
                                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-bubblegum'
                        )}
                    >
                        {loading ? 'Processing…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Enrollment Details Modal ────────────────────────────────────────────────

interface DetailModalProps {
    enrollment: AdminEnrollmentDetails;
    onClose: () => void;
    onEditFee: (enr: AdminEnrollmentDetails) => void;
    onToggleStatus: (enr: AdminEnrollmentDetails) => void;
}

function EnrollmentDetailModal({ enrollment, onClose, onEditFee, onToggleStatus }: DetailModalProps) {
    const studentName = enrollment.student_name || enrollment.student_details?.name || '—';
    const parentName = enrollment.parent_name || '—';
    const parentPhone = enrollment.parent_phone || '';
    const studentId = typeof enrollment.student === 'object' ? enrollment.student?.id : enrollment.student_details?.id || enrollment.student;
    const batchName = enrollment.batch_name || enrollment.batch_details?.name || '—';
    const feeType = enrollment.fee_type || 'course';

    return (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-card rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between px-6 py-4 border-b border-default z-10">
                    <div>
                        <h2 className="text-base font-bold text-heading">Enrollment Details</h2>
                        <p className="text-xs text-body-muted">ID #{enrollment.id} · Created {formatDate(enrollment.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge active={enrollment.is_active} />
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                            <X className="w-5 h-5 text-body-muted" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Student Card */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-4 space-y-2.5">
                        <p className="text-xs font-semibold text-body-muted uppercase tracking-wider">Student Profile</p>
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="font-bold text-heading text-sm">{studentName}</p>
                                <p className="text-xs text-body-muted mt-0.5">{parentName}</p>
                            </div>
                            {studentId && (
                                <Link href={`/admin/students/${studentId}`} onClick={onClose}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary hover:bg-primary/20 text-xs font-medium transition-colors shrink-0 shadow-sm">
                                    <ExternalLink className="w-3 h-3" />View Profile
                                </Link>
                            )}
                        </div>
                        {parentPhone && (
                            <a href={`tel:${parentPhone}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-200 transition-colors">
                                <Phone className="w-3 h-3" />{parentPhone}
                            </a>
                        )}
                    </div>

                    {/* Course & Batch Card */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-4 space-y-1.5">
                        <p className="text-xs font-semibold text-body-muted uppercase tracking-wider mb-2">Class Assignment</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-body-muted">Batch</span>
                            <span className="text-sm font-semibold text-heading">{batchName}</span>
                        </div>
                        {enrollment.course_name && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-body-muted">Course</span>
                                <span className="text-sm font-medium text-heading">{enrollment.course_name}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-body-muted">Start Month</span>
                            <span className="text-sm font-medium text-heading">{formatMonth(enrollment.start_month)}</span>
                        </div>
                    </div>

                    {/* Fee Details Card */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-4 space-y-1.5">
                        <p className="text-xs font-semibold text-body-muted uppercase tracking-wider mb-2">Tuition Fee Settings</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-body-muted">Tuition Fee</span>
                            <span className="text-base font-bold text-heading">{fmt(enrollment.effective_tuition_fee)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-body-muted">Fee Context Level</span>
                            <FeeLevelBadge type={feeType} />
                        </div>
                    </div>
                </div>

                {/* Actions sticky footer */}
                <div className="sticky bottom-0 bg-card border-t border-default px-6 py-4 rounded-b-3xl sm:rounded-b-2xl">
                    <div className="flex gap-3">
                        <button onClick={() => onEditFee(enrollment)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-heading hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />Update Fee
                        </button>
                        <button onClick={() => onToggleStatus(enrollment)}
                            className={cn(
                                'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                                enrollment.is_active 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200' 
                                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary hover:bg-primary/20'
                            )}>
                            <RefreshCw className="w-3.5 h-3.5" />
                            {enrollment.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Tuition Fee Modal ──────────────────────────────────────────────────

interface EditFeeModalProps {
    enrollment: AdminEnrollmentDetails;
    onClose: () => void;
    onSuccess: (enr: AdminEnrollmentDetails) => void;
}

function EditFeeModal({ enrollment, onClose, onSuccess }: EditFeeModalProps) {
    const [fee, setFee] = useState(enrollment.tuition_fee !== null ? Math.round(Number(enrollment.tuition_fee)).toString() : '');
    const [useDefault, setUseDefault] = useState(enrollment.tuition_fee === null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const studentName = enrollment.student_name || enrollment.student_details?.name || '—';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const tuition_fee = useDefault ? null : (fee === '' ? null : parseFloat(fee));
        if (!useDefault && tuition_fee !== null && (isNaN(tuition_fee) || tuition_fee < 0)) {
            setError('Enter a valid tuition fee.');
            setSubmitting(false);
            return;
        }

        try {
            await adminApi.updateEnrollmentFee(enrollment.id, { tuition_fee });
            const detailsRes = await adminApi.getEnrollment(enrollment.id);
            onSuccess(detailsRes.data);
        } catch (err: any) {
            const d = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to update tuition fee.';
            setError(typeof d === 'string' ? d : JSON.stringify(d));
        } finally { setSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md animate-slide-up sm:animate-scale-in">
                <div className="flex items-center justify-between px-6 py-4 border-b border-default">
                    <div>
                        <h2 className="text-base font-bold text-heading">Update Tuition Fee</h2>
                        <p className="text-xs text-body-muted">Student: {studentName}</p>
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

                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-default hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                            <div onClick={() => setUseDefault(p => !p)}
                                className={cn('w-10 h-6 rounded-full relative transition-colors shrink-0 cursor-pointer', useDefault ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-600')}>
                                <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', useDefault ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-heading">Use default fee</p>
                                <p className="text-xs text-body-muted">Reverts back to standard batch/course fee levels</p>
                            </div>
                        </label>

                        {!useDefault && (
                            <div>
                                <label className="block text-sm font-medium text-heading mb-1.5">Custom Tuition Fee (৳) *</label>
                                <input
                                    type="number"
                                    value={fee}
                                    onChange={e => setFee(e.target.value)}
                                    placeholder="e.g. 1500"
                                    min="0"
                                    className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20 text-sm"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 rounded-xl border border-default bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-colors text-sm font-semibold shadow-bubblegum disabled:opacity-60"
                        >
                            {submitting ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Create Enrollment Modal ─────────────────────────────────────────────────

interface CreateModalProps {
    onClose: () => void;
    onSuccess: (enr: AdminEnrollmentDetails) => void;
}

function CreateEnrollmentModal({ onClose, onSuccess }: CreateModalProps) {
    const [students, setStudents] = useState<{ id: number; name: string; phone?: string }[]>([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<{ id: number; name: string } | null>(null);
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const studentDropdownRef = useRef<HTMLDivElement>(null);

    const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<number | ''>('');
    const [batches, setBatches] = useState<{ id: number; name: string }[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<number | ''>('');
    const [startMonth, setStartMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [customFee, setCustomFee] = useState('');
    const [useCustomFee, setUseCustomFee] = useState(false);

    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (studentDropdownRef.current && !studentDropdownRef.current.contains(e.target as Node)) setShowStudentDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        setLoadingCourses(true);
        adminApi.getCourses({ is_active: true })
            .then(r => {
                const list = r.data.results ?? (r.data as any);
                setCourses(Array.isArray(list) ? list.map((c: any) => ({ id: c.id, name: c.name })) : []);
            })
            .catch(() => {})
            .finally(() => setLoadingCourses(false));
    }, []);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (!studentSearch && !showStudentDropdown) return;
            setLoadingStudents(true);
            try {
                const r = await adminApi.getAllStudents({ search: studentSearch || undefined });
                const list = r.data.results ?? (r.data as any);
                setStudents(Array.isArray(list) ? list.map((s: any) => ({ id: s.id, name: s.name, phone: s.parent_phone })) : []);
                setShowStudentDropdown(true);
            } catch { setStudents([]); }
            finally { setLoadingStudents(false); }
        }, 300);
        return () => clearTimeout(t);
    }, [studentSearch, showStudentDropdown]);

    useEffect(() => {
        setSelectedBatch('');
        if (!selectedCourse) {
            setBatches([]);
            return;
        }
        setLoadingBatches(true);
        adminApi.getBatches({ course: Number(selectedCourse), is_visible: true })
            .then(r => {
                const list = r.data.results ?? (r.data as any);
                setBatches(Array.isArray(list) ? list.map((b: any) => ({ id: b.id, name: b.name })) : []);
            })
            .catch(() => setBatches([]))
            .finally(() => setLoadingBatches(false));
    }, [selectedCourse]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedStudent) { setError('Select a student.'); return; }
        if (!selectedBatch) { setError('Select a batch.'); return; }
        if (!startMonth) { setError('Select a start month.'); return; }

        setSubmitting(true);
        const tuition_fee = useCustomFee ? (customFee === '' ? null : parseFloat(customFee)) : null;

        try {
            const r = await adminApi.createEnrollment({
                student: selectedStudent.id,
                batch: Number(selectedBatch),
                start_month: startMonth + '-01',
                tuition_fee
            });
            const detailRes = await adminApi.getEnrollment(r.data.id);
            onSuccess(detailRes.data);
        } catch (err: any) {
            const d = err?.response?.data?.error || err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || 'Failed to create enrollment.';
            setError(typeof d === 'string' ? d : JSON.stringify(d));
        } finally { setSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-default">
                    <div>
                        <h2 className="text-base font-bold text-heading">Direct Enrollment</h2>
                        <p className="text-xs text-body-muted">Quick enroll a student into any class batch</p>
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

                    {/* Student Selection */}
                    <div ref={studentDropdownRef} className="relative">
                        <label className="block text-sm font-medium text-heading mb-1.5">Student Name *</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted pointer-events-none" />
                            <input
                                type="text"
                                value={selectedStudent ? selectedStudent.name : studentSearch}
                                onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudent(null); }}
                                onFocus={() => setShowStudentDropdown(true)}
                                placeholder="Search by student name…"
                                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20 text-sm"
                                required
                            />
                            {(selectedStudent || studentSearch) && (
                                <button type="button" onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted hover:text-heading">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {showStudentDropdown && !selectedStudent && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-default rounded-xl shadow-lg z-50 overflow-hidden max-h-52 overflow-y-auto animate-slide-down">
                                {loadingStudents ? <div className="px-4 py-3 text-sm text-body-muted">Searching…</div>
                                    : students.length === 0 ? <div className="px-4 py-3 text-sm text-body-muted">No students found</div>
                                        : students.map(s => (
                                            <button key={s.id} type="button" onClick={() => { setSelectedStudent(s); setShowStudentDropdown(false); }}
                                                className="w-full text-left px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                                <p className="text-sm font-bold text-heading">{s.name}</p>
                                                {s.phone && <p className="text-xs text-body-muted">Parent Phone: {s.phone}</p>}
                                            </button>
                                        ))}
                            </div>
                        )}
                    </div>

                    {/* Course Selection */}
                    <DropdownSelect
                        label="Course *"
                        value={String(selectedCourse)}
                        options={courses}
                        placeholder="Select Course"
                        onSelect={v => setSelectedCourse(v === '' ? '' : Number(v))}
                        loading={loadingCourses}
                    />

                    {/* Batch Selection */}
                    <DropdownSelect
                        label="Batch *"
                        value={String(selectedBatch)}
                        options={batches}
                        placeholder={selectedCourse ? 'Select Batch' : 'Select a course first'}
                        onSelect={v => setSelectedBatch(v === '' ? '' : Number(v))}
                        loading={loadingBatches}
                    />

                    {/* Start Month */}
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1.5">Start Month *</label>
                        <input
                            type="month"
                            value={startMonth}
                            onChange={e => setStartMonth(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20 text-sm"
                            required
                        />
                    </div>

                    {/* Custom Tuition Fee */}
                    <div className="space-y-3 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-default hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                            <div onClick={() => setUseCustomFee(p => !p)}
                                className={cn('w-10 h-6 rounded-full relative transition-colors shrink-0 cursor-pointer', useCustomFee ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-600')}>
                                <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', useCustomFee ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-heading">Apply custom tuition fee</p>
                                <p className="text-xs text-body-muted">Overrides standard course/batch fees</p>
                            </div>
                        </label>

                        {useCustomFee && (
                            <div>
                                <label className="block text-sm font-medium text-heading mb-1.5">Tuition Fee (৳) *</label>
                                <input
                                    type="number"
                                    value={customFee}
                                    onChange={e => setCustomFee(e.target.value)}
                                    placeholder="e.g. 1500"
                                    min="0"
                                    className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20 text-sm"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 rounded-xl border border-default bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-colors text-sm font-semibold shadow-bubblegum disabled:opacity-60"
                        >
                            {submitting ? 'Enrolling…' : 'Enroll Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Fee Level Badge ─────────────────────────────────────────────────────────

function FeeLevelBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        individual: 'bg-primary-100 dark:bg-primary-900/30 text-primary',
        batch: 'bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400',
        course: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary',
    };
    
    const labels: Record<string, string> = {
        individual: 'Individual',
        batch: 'Batch',
        course: 'Course',
    };

    const badgeType = colors[type] ? type : 'course';
    
    return (
        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', colors[badgeType])}>
            {labels[badgeType]}
        </span>
    );
}

// ─── Table Row (Desktop) ──────────────────────────────────────────────────────

function EnrollmentRow({ enrollment, onClick }: { enrollment: AdminEnrollmentDetails; onClick: () => void }) {
    const studentName = enrollment.student_name || enrollment.student_details?.name || '—';
    const parentName = enrollment.parent_name || '—';
    const batchName = enrollment.batch_name || enrollment.batch_details?.name || '—';
    const feeType = enrollment.fee_type || 'course';

    return (
        <tr onClick={onClick} style={{ contentVisibility: 'auto', containIntrinsicSize: '58px' } as React.CSSProperties} className="border-b border-default hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors cursor-pointer">
            <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                        enrollment.is_active 
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary' 
                            : 'bg-neutral-100 dark:bg-neutral-800 text-body-muted')}>
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-heading text-sm leading-tight">{studentName}</p>
                        <p className="text-xs text-body-muted mt-1">{parentName}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-4">
                <p className="text-sm font-semibold text-heading leading-tight">{batchName}</p>
                {enrollment.course_name && <p className="text-xs text-body-muted mt-1">{enrollment.course_name}</p>}
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-sm text-heading font-medium">
                    <Calendar className="w-4 h-4 text-body-muted shrink-0" />
                    {formatMonth(enrollment.start_month)}
                </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1 items-start">
                    <span className="text-sm font-extrabold text-heading">{fmt(enrollment.effective_tuition_fee)}</span>
                    <FeeLevelBadge type={feeType} />
                </div>
            </td>
            <td className="px-4 py-4"><StatusBadge active={enrollment.is_active} /></td>
        </tr>
    );
}

// ─── Card (Mobile) ────────────────────────────────────────────────────────────

function EnrollmentCard({ enrollment, onClick }: { enrollment: AdminEnrollmentDetails; onClick: () => void }) {
    const studentName = enrollment.student_name || enrollment.student_details?.name || '—';
    const batchName = enrollment.batch_name || enrollment.batch_details?.name || '—';
    const feeType = enrollment.fee_type || 'course';

    return (
        <div onClick={onClick} style={{ contentVisibility: 'auto', containIntrinsicSize: '100px' } as React.CSSProperties} className="p-4 border-b border-default last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                    enrollment.is_active 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary' 
                        : 'bg-neutral-100 dark:bg-neutral-800 text-body-muted')}>
                    <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-heading text-sm leading-tight truncate">{studentName}</p>
                        <StatusBadge active={enrollment.is_active} />
                    </div>
                    <p className="text-xs text-body-muted truncate">{batchName}</p>
                    {enrollment.course_name && <p className="text-xs text-body-muted truncate">{enrollment.course_name}</p>}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-sm font-extrabold text-heading">{fmt(enrollment.effective_tuition_fee)}</span>
                        <span className="text-xs text-body-muted flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />{formatMonth(enrollment.start_month)}
                        </span>
                        <FeeLevelBadge type={feeType} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

type SortField = '-created_at' | 'created_at' | '-effective_tuition_fee' | 'effective_tuition_fee' | 'student_name' | '-student_name';
type EnrollmentStatus = 'all' | 'active' | 'inactive';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
    { value: '-created_at', label: 'Date Added (Newest)' },
    { value: 'created_at', label: 'Date Added (Oldest)' },
    { value: '-effective_tuition_fee', label: 'Fee (High → Low)' },
    { value: 'effective_tuition_fee', label: 'Fee (Low → High)' },
    { value: 'student_name', label: 'Student A–Z' },
    { value: '-student_name', label: 'Student Z–A' },
];

const STATUS_OPTS: { value: EnrollmentStatus; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active Only' },
    { value: 'inactive', label: 'Inactive Only' },
];

const LIMIT = 50;

export default function AdminEnrollmentsPage() {
    // Data List
    const [enrollments, setEnrollments] = useState<AdminEnrollmentDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalCount, setTotalCount] = useState(0);

    // Pagination
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const observerTargetRef = useRef<HTMLDivElement>(null);

    // Filters Data
    const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
    const [batches, setBatches] = useState<{ id: number; name: string }[]>([]);
    const [parents, setParents] = useState<{ id: number; name: string }[]>([]);
    const [students, setStudents] = useState<{ id: number; name: string }[]>([]);

    // Search and filters selections
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<EnrollmentStatus>('all');
    const [courseFilter, setCourseFilter] = useState<number | ''>('');
    const [batchFilter, setBatchFilter] = useState<number | ''>('');
    const [parentFilter, setParentFilter] = useState<number | ''>('');
    const [studentFilter, setStudentFilter] = useState<number | ''>('');
    const [showFilters, setShowFilters] = useState(false);

    // Sorting
    const [sortField, setSortField] = useState<SortField>('-created_at');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);

    // Modals & Action states
    const [detailEnrollment, setDetailEnrollment] = useState<AdminEnrollmentDetails | null>(null);
    const [createModal, setCreateModal] = useState(false);
    const [editFeeEnrollment, setEditFeeEnrollment] = useState<AdminEnrollmentDetails | null>(null);

    // Confirmation dialogs
    const [confirmToggleStatus, setConfirmToggleStatus] = useState<AdminEnrollmentDetails | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Debounce search input
    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Close sort dropdown on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Reset batch option if course filter changes
    useEffect(() => {
        setBatchFilter('');
        if (!courseFilter) { setBatches([]); return; }
        adminApi.getBatches({ course: Number(courseFilter) })
            .then(r => {
                const list = r.data.results ?? (r.data as any);
                setBatches(Array.isArray(list) ? list : []);
            })
            .catch(() => setBatches([]));
    }, [courseFilter]);

    // Load static items for filter dropdowns once
    useEffect(() => {
        adminApi.getCourses().then(r => {
            const list = r.data.results ?? (r.data as any);
            setCourses(Array.isArray(list) ? list.map((c: any) => ({ id: c.id, name: c.name })) : []);
        }).catch(() => {});
        adminApi.getAllParents().then(r => {
            const list = r.data.results ?? (r.data as any);
            setParents(Array.isArray(list) ? list.map((p: any) => ({ id: p.id, name: `${p.name} (${p.phone})` })) : []);
        }).catch(() => {});
        adminApi.getAllStudents().then(r => {
            const list = r.data.results ?? (r.data as any);
            setStudents(Array.isArray(list) ? list.map((s: any) => ({ id: s.id, name: s.name })) : []);
        }).catch(() => {});
    }, []);

    // Dynamic Filter Query building
    const filterParams = useMemo(() => {
        const p: Record<string, any> = {};
        if (statusFilter === 'active') p.is_active = true;
        if (statusFilter === 'inactive') p.is_active = false;
        if (courseFilter) p.course = courseFilter;
        if (batchFilter) p.batch = batchFilter;
        if (studentFilter) p.student = studentFilter;
        return p;
    }, [statusFilter, courseFilter, batchFilter, studentFilter]);

    // Fetch call helper
    const fetchEnrollments = useCallback(async (currentOffset: number = 0, append: boolean = false) => {
        if (currentOffset === 0) {
            setOffset(0);
            setLoading(true);
        } else {
            setIsFetchingNextPage(true);
        }
        setError('');

        try {
            const r = await adminApi.getEnrollments({
                ...filterParams,
                offset: currentOffset,
                limit: LIMIT
            });
            const list = Array.isArray(r.data) ? r.data : (r.data.results ?? []);
            const totalCountFromServer = r.data.count ?? list.length;

            setEnrollments(prev => {
                const newList = append ? [...prev, ...list] : list;
                setHasMore(newList.length < totalCountFromServer);
                return newList;
            });
            setTotalCount(totalCountFromServer);
        } catch {
            setError('Failed to fetch enrollments.');
        } finally {
            setLoading(false);
            setIsFetchingNextPage(false);
        }
    }, [filterParams]);

    // Load next page
    const loadMore = useCallback(() => {
        if (loading || isFetchingNextPage || !hasMore) return;
        const nextOffset = offset + LIMIT;
        setOffset(nextOffset);
        fetchEnrollments(nextOffset, true);
    }, [offset, loading, isFetchingNextPage, hasMore, fetchEnrollments]);

    // Refresh triggers
    useEffect(() => {
        fetchEnrollments(0, false);
    }, [filterParams, fetchEnrollments]);

    // Infinite scrolling Intersection observer
    useEffect(() => {
        const target = observerTargetRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) loadMore(); },
            { threshold: 0.1 }
        );
        observer.observe(target);
        return () => { if (target) observer.unobserve(target); };
    }, [loadMore]);

    // Client-side local filtering (For complex nested matching like search and parents)
    const processedEnrollments = useMemo(() => {
        let list = [...enrollments];

        // Search text matching student parent names or phone numbers
        if (searchQuery) {
            const sq = searchQuery.toLowerCase();
            list = list.filter(e => {
                const sName = e.student_name || e.student_details?.name || '';
                const pName = e.parent_name || '';
                const pPhone = e.parent_phone || '';
                return sName.toLowerCase().includes(sq) ||
                    pName.toLowerCase().includes(sq) ||
                    pPhone.includes(sq);
            });
        }

        // Status filter matching active/inactive status
        if (statusFilter === 'active') {
            list = list.filter(e => e.is_active === true);
        } else if (statusFilter === 'inactive') {
            list = list.filter(e => e.is_active === false);
        }

        // Course filter matching batch's course ID
        if (courseFilter) {
            list = list.filter(e => {
                const courseId = e.batch_details?.course || (typeof e.batch === 'object' ? e.batch.course_id : undefined);
                return courseId === courseFilter;
            });
        }

        // Batch filter matching batch ID
        if (batchFilter) {
            list = list.filter(e => {
                const batchId = typeof e.batch === 'object' ? e.batch.id : e.batch_details?.id || e.batch;
                return batchId === batchFilter;
            });
        }

        // Student filter matching student ID
        if (studentFilter) {
            list = list.filter(e => {
                const studentId = typeof e.student === 'object' ? e.student.id : e.student_details?.id || e.student;
                return studentId === studentFilter;
            });
        }

        // Parent filter matching parent IDs
        if (parentFilter) {
            list = list.filter(e => {
                const pId = e.parent_id || e.student_details?.parent;
                return pId === parentFilter;
            });
        }

        // Sorting
        list.sort((a, b) => {
            if (sortField === '-created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortField === 'created_at') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortField === '-effective_tuition_fee') return b.effective_tuition_fee - a.effective_tuition_fee;
            if (sortField === 'effective_tuition_fee') return a.effective_tuition_fee - b.effective_tuition_fee;
            
            const aName = a.student_name || a.student_details?.name || '';
            const bName = b.student_name || b.student_details?.name || '';
            if (sortField === 'student_name') return aName.localeCompare(bName);
            if (sortField === '-student_name') return bName.localeCompare(aName);
            return 0;
        });

        return list;
    }, [enrollments, searchQuery, parentFilter, sortField, statusFilter, courseFilter, batchFilter, studentFilter]);

    // Locally computed Stats for complete responsive feedback!
    const computedStats = useMemo(() => {
        const total = processedEnrollments.length;
        const active = processedEnrollments.filter(e => e.is_active).length;
        const inactive = total - active;
        const activeMRR = processedEnrollments
            .filter(e => e.is_active)
            .reduce((sum, e) => sum + e.effective_tuition_fee, 0);

        return { total, active, inactive, activeMRR };
    }, [processedEnrollments]);

    // Active Chips items
    const activeFiltersList: { key: string; label: string; clear: () => void }[] = [];
    if (searchQuery) activeFiltersList.push({ key: 'search', label: `"${searchQuery}"`, clear: () => { setSearchInput(''); setSearchQuery(''); } });
    if (statusFilter !== 'all') activeFiltersList.push({ key: 'status', label: STATUS_OPTS.find(s => s.value === statusFilter)?.label ?? '', clear: () => setStatusFilter('all') });
    if (courseFilter) activeFiltersList.push({ key: 'course', label: `Course: ${courses.find(c => c.id === courseFilter)?.name ?? courseFilter}`, clear: () => setCourseFilter('') });
    if (batchFilter) activeFiltersList.push({ key: 'batch', label: `Batch: ${batches.find(b => b.id === batchFilter)?.name ?? batchFilter}`, clear: () => setBatchFilter('') });
    if (parentFilter) activeFiltersList.push({ key: 'parent', label: `Parent: ${parents.find(p => p.id === parentFilter)?.name ?? parentFilter}`, clear: () => setParentFilter('') });
    if (studentFilter) activeFiltersList.push({ key: 'student', label: `Student: ${students.find(s => s.id === studentFilter)?.name ?? studentFilter}`, clear: () => setStudentFilter('') });

    const handleClearAll = () => {
        setSearchInput(''); setSearchQuery('');
        setStatusFilter('all');
        setCourseFilter(''); setBatchFilter('');
        setParentFilter(''); setStudentFilter('');
    };

    const updateInList = (updated: AdminEnrollmentDetails) => {
        setEnrollments(prev => prev.map(e => e.id === updated.id ? updated : e));
        if (detailEnrollment?.id === updated.id) setDetailEnrollment(updated);
    };

    const handleToggleStatus = async () => {
        if (!confirmToggleStatus) return;
        setActionLoading(true);
        try {
            const nextStatus = !confirmToggleStatus.is_active;
            await adminApi.updateEnrollment(confirmToggleStatus.id, { is_active: nextStatus });
            const detailsRes = await adminApi.getEnrollment(confirmToggleStatus.id);
            updateInList(detailsRes.data);
            setConfirmToggleStatus(null);
        } catch (err: any) {
            alert(err?.response?.data?.error ?? 'Failed to update activation status.');
        } finally { setActionLoading(false); }
    };

    const openEditFee = (enr: AdminEnrollmentDetails) => { setDetailEnrollment(null); setEditFeeEnrollment(enr); };
    const openToggleStatus = (enr: AdminEnrollmentDetails) => { setDetailEnrollment(null); setConfirmToggleStatus(enr); };

    const sortLabel = SORT_OPTIONS.find(s => s.value === sortField)?.label ?? 'Sort';

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {loading && enrollments.length === 0 ? (
                    [1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)
                ) : (
                    <>
                        <div className="bg-card rounded-2xl border border-default p-4 sm:p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-primary-100 dark:bg-primary-900/30">
                                    <GraduationCap className="w-5 h-5 text-primary" />
                                </div>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-heading leading-tight">{computedStats.total}</p>
                            <p className="text-xs text-body-muted mt-0.5">Total Enrollments</p>
                        </div>
                        <div className="bg-card rounded-2xl border border-default p-4 sm:p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 dark:bg-emerald-900/30">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-heading leading-tight">{computedStats.active}</p>
                            <p className="text-xs text-body-muted mt-0.5">Active Batches</p>
                        </div>
                        <div className="bg-card rounded-2xl border border-default p-4 sm:p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-neutral-100 dark:bg-neutral-800">
                                    <XCircle className="w-5 h-5 text-neutral-500" />
                                </div>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-heading leading-tight">{computedStats.inactive}</p>
                            <p className="text-xs text-body-muted mt-0.5">Deactivated Accounts</p>
                        </div>
                        <div className="bg-card rounded-2xl border border-default p-4 sm:p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-primary-100 dark:bg-primary-900/30">
                                    <DollarSign className="w-5 h-5 text-primary" />
                                </div>
                            </div>
                            <p className="text-xl sm:text-2xl font-extrabold text-primary leading-tight">{fmt(computedStats.activeMRR)}</p>
                            <p className="text-xs text-body-muted mt-0.5">Estimated MRR</p>
                        </div>
                    </>
                )}
            </div>

            {/* Main Content Dashboard console */}
            <div className="bg-card rounded-2xl border border-default shadow-sm overflow-hidden">
                {/* Search & Filter Header controls */}
                <div className="p-4 border-b border-default space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder="Search by student name, parent phone…"
                                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20 text-sm"
                            />
                            {searchInput && (
                                <button onClick={() => { setSearchInput(''); setSearchQuery(''); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted hover:text-heading transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {/* Sort selector */}
                            <div className="relative" ref={sortRef}>
                                <button onClick={() => setShowSortDropdown(p => !p)}
                                    className="inline-flex items-center gap-2 px-3 py-2.5 border border-default rounded-xl bg-input text-sm font-medium text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                    <ArrowUpDown className="w-4 h-4 text-body-muted" />
                                    <span className="hidden sm:inline truncate max-w-[120px]">{sortLabel}</span>
                                </button>
                                {showSortDropdown && (
                                    <div className="absolute right-0 top-full mt-1 bg-card border border-default rounded-xl shadow-lg z-50 overflow-hidden min-w-[200px] animate-slide-down">
                                        {SORT_OPTIONS.map(opt => (
                                            <button key={opt.value} onClick={() => { setSortField(opt.value); setShowSortDropdown(false); }}
                                                className={cn('w-full text-left px-4 py-2.5 text-sm transition-colors',
                                                    sortField === opt.value ? 'bg-primary text-primary-foreground font-medium' : 'text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Filter toggler */}
                            <button onClick={() => setShowFilters(p => !p)}
                                className={cn('inline-flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors',
                                    showFilters || activeFiltersList.length > 0
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-default bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Filters</span>
                                {activeFiltersList.length > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                        {activeFiltersList.length}
                                    </span>
                                )}
                            </button>

                            {/* Refresh */}
                            <button onClick={() => fetchEnrollments(0, false)}
                                className="p-2.5 border border-default rounded-xl bg-input text-body-muted hover:text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" title="Refresh">
                                <RefreshCw className="w-4 h-4" />
                            </button>

                            {/* Add Direct Enrollment Creation button */}
                            <button
                                onClick={() => setCreateModal(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/95 transition-colors shrink-0 shadow-bubblegum"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Enroll Student</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter fields drawer */}
                    {showFilters && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1 animate-slide-down">
                            {/* Active Status */}
                            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                                <label className="block text-xs font-medium text-body-muted mb-1.5">Status</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {STATUS_OPTS.map(opt => (
                                        <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
                                            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
                                                statusFilter === opt.value
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'border-default bg-input text-body-muted hover:text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
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

                    {/* Active chips bar */}
                    {activeFiltersList.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                            {activeFiltersList.map(f => <FilterChip key={f.key} label={f.label} onRemove={f.clear} />)}
                            <button onClick={handleClearAll} className="text-xs text-body-muted hover:text-heading transition-colors underline underline-offset-2">
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Count and metadata bar */}
                {!loading && (
                    <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/30 border-b border-default flex items-center justify-between">
                        <p className="text-xs text-body-muted">
                            {processedEnrollments.length === 0 ? 'No enrollments found' : `${processedEnrollments.length} enrollment${processedEnrollments.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                )}

                {/* Error status card */}
                {error && (
                    <div className="m-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                        <button onClick={() => fetchEnrollments(0, false)} className="ml-auto underline text-xs">Retry</button>
                    </div>
                )}

                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-default bg-neutral-50 dark:bg-neutral-900/30">
                                {['Student / Parent', 'Batch', 'Start Month', 'Tuition Fee', 'Status'].map(h => (
                                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-body-muted uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && enrollments.length === 0
                                ? Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)
                                : processedEnrollments.length === 0
                                    ? <tr><td colSpan={5} className="px-4 py-16 text-center">
                                        <GraduationCap className="w-10 h-10 mx-auto mb-3 text-body-subtle opacity-40" />
                                        <p className="text-body-muted text-sm font-semibold">No enrollments found</p>
                                        <p className="text-body-subtle text-xs mt-1">Try adjusting your filters or adding a new enrollment</p>
                                    </td></tr>
                                    : processedEnrollments.map(enr => <EnrollmentRow key={enr.id} enrollment={enr} onClick={() => setDetailEnrollment(enr)} />)
                            }
                            {!loading && isFetchingNextPage && Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={`next-skele-${i}`} />)}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Cards */}
                <div className="md:hidden">
                    {loading && enrollments.length === 0
                        ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                        : processedEnrollments.length === 0
                            ? <div className="py-16 text-center">
                                <GraduationCap className="w-10 h-10 mx-auto mb-3 text-body-subtle opacity-40" />
                                <p className="text-body-muted text-sm font-semibold">No enrollments found</p>
                                <p className="text-body-subtle text-xs mt-1">Try adjusting your filters or adding a new enrollment</p>
                            </div>
                            : processedEnrollments.map(enr => <EnrollmentCard key={enr.id} enrollment={enr} onClick={() => setDetailEnrollment(enr)} />)
                    }
                    {!loading && isFetchingNextPage && Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={`next-card-skele-${i}`} />)}
                </div>

                {/* Observer infinite scroll trigger */}
                {hasMore && !loading && (
                    <div ref={observerTargetRef} className="h-4 w-full" />
                )}
            </div>

            {/* Modals & Dialog blocks */}
            {detailEnrollment && (
                <EnrollmentDetailModal 
                    enrollment={detailEnrollment} 
                    onClose={() => setDetailEnrollment(null)}
                    onEditFee={openEditFee} 
                    onToggleStatus={openToggleStatus} 
                />
            )}
            {createModal && (
                <CreateEnrollmentModal 
                    onClose={() => setCreateModal(false)}
                    onSuccess={enr => { 
                        setEnrollments(p => [enr, ...p]); 
                        setTotalCount(c => c + 1); 
                        setCreateModal(false); 
                    }} 
                />
            )}
            {editFeeEnrollment && (
                <EditFeeModal 
                    enrollment={editFeeEnrollment} 
                    onClose={() => setEditFeeEnrollment(null)}
                    onSuccess={enr => { 
                        updateInList(enr); 
                        setEditFeeEnrollment(null); 
                    }} 
                />
            )}

            {/* Confirm Dialog: Activation toggler */}
            {confirmToggleStatus && (
                <ConfirmDialog
                    title={confirmToggleStatus.is_active ? 'Deactivate Enrollment?' : 'Reactivate Enrollment?'}
                    message={
                        confirmToggleStatus.is_active
                            ? `Are you sure you want to deactivate ${(confirmToggleStatus.student_name || confirmToggleStatus.student_details?.name || '')}'s enrollment in batch ${(confirmToggleStatus.batch_name || confirmToggleStatus.batch_details?.name || '')}? This will suspend their billing and attendance access.`
                            : `Reactivate ${(confirmToggleStatus.student_name || confirmToggleStatus.student_details?.name || '')}'s enrollment in batch ${(confirmToggleStatus.batch_name || confirmToggleStatus.batch_details?.name || '')}? Conflicting active enrollments in the same course will automatically merge.`
                    }
                    confirmLabel={confirmToggleStatus.is_active ? 'Deactivate' : 'Reactivate'}
                    confirmVariant={confirmToggleStatus.is_active ? 'danger' : 'primary'}
                    onConfirm={handleToggleStatus}
                    onCancel={() => setConfirmToggleStatus(null)}
                    loading={actionLoading}
                />
            )}
        </div>
    );
}
