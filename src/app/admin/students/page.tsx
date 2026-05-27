'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Search,
    Loader2,
    GraduationCap,
    BookOpen,
    ChevronDown,
    ChevronUp,
    X,
    Phone,
    Facebook,
    Calendar,
    Filter,
    ArrowUpDown,
    AlertCircle,
    RefreshCw,
    Plus,
    ClipboardList,
    User as UserIcon,
    CircleUser,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/adminApi';
import { AdminStudent, AdminEnrollmentInfo, Course, Batch } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Deterministic palette from course ID so same course always has same color */
const COURSE_COLORS = [
    { bg: 'bg-lavender-100 dark:bg-lavender-900/30', text: 'text-lavender-700 dark:text-lavender-300', border: 'border-lavender-200 dark:border-lavender-700' },
    { bg: 'bg-secondary-100 dark:bg-secondary-900/30', text: 'text-secondary-700 dark:text-secondary-300', border: 'border-secondary-200 dark:border-secondary-700' },
    { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700' },
    { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-700' },
    { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-700' },
    { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-700' },
];

function courseColor(courseId: number) {
    return COURSE_COLORS[courseId % COURSE_COLORS.length];
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMonth(monthStr: string): string {
    return new Date(monthStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────



// Loading Skeleton Row
function SkeletonRow() {
    return (
        <tr className="border-b border-default">
            {[1,2,3,4,5].map((i) => (
                <td key={i} className="px-4 py-3">
                    <div className="animate-skeleton h-4 rounded-lg" style={{ width: `${60 + i * 8}%` }} />
                </td>
            ))}
        </tr>
    );
}

// Skeleton Card (mobile)
function SkeletonCard() {
    return (
        <div className="p-4 border-b border-default animate-pulse">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                </div>
            </div>
        </div>
    );
}

// Filter chip
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 transition-all">
            {label}
            <button
                onClick={onRemove}
                className="w-3.5 h-3.5 rounded-full hover:bg-primary/20 transition-colors flex items-center justify-center"
            >
                <X className="w-2.5 h-2.5" />
            </button>
        </span>
    );
}

// Enrollment badge
function EnrollmentBadge({ enrollment }: { enrollment: AdminEnrollmentInfo }) {
    const color = courseColor(enrollment.course_id);
    return (
        <span className={cn(
            'inline-flex flex-col px-2.5 py-1 rounded-lg text-xs border',
            color.bg, color.text, color.border
        )}>
            <span className="font-semibold leading-tight truncate max-w-[240px]">{enrollment.course_name}</span>
            <span className="opacity-70 leading-tight truncate max-w-[240px]">{enrollment.batch_name}</span>
        </span>
    );
}

// ─── Quick Enroll Modal ───────────────────────────────────────────────────────

interface QuickEnrollModalProps {
    student: AdminStudent;
    onClose: () => void;
    onSuccess: () => void;
}

function QuickEnrollModal({ student, onClose, onSuccess }: QuickEnrollModalProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<number | ''>('');
    const [selectedBatch, setSelectedBatch] = useState<number | ''>('');
    const [startMonth, setStartMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [showCourseDropdown, setShowCourseDropdown] = useState(false);
    const [showBatchDropdown, setShowBatchDropdown] = useState(false);
    const modalCourseRef = useRef<HTMLDivElement>(null);
    const modalBatchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (modalCourseRef.current && !modalCourseRef.current.contains(e.target as Node)) {
                setShowCourseDropdown(false);
            }
            if (modalBatchRef.current && !modalBatchRef.current.contains(e.target as Node)) {
                setShowBatchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        setLoading(true);
        adminApi.getCourses({ is_active: true })
            .then((r) => {
                const data = r.data.results || (r.data as any);
                setCourses(Array.isArray(data) ? data : []);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedCourse) { setBatches([]); setSelectedBatch(''); return; }
        adminApi.getBatches({ course: Number(selectedCourse), is_visible: true })
            .then((r) => {
                const data = r.data.results || (r.data as any);
                setBatches(Array.isArray(data) ? data : []);
                setSelectedBatch('');
            });
    }, [selectedCourse]);

    const filteredBatches = batches.filter((b) => b.course === Number(selectedCourse));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatch) { setError('Please select a batch'); return; }
        setError('');
        setSubmitting(true);
        try {
            const apiClient = (await import('@/lib/api')).default;
            await apiClient.post('/enrollments/enrollments/', {
                student: student.id,
                batch: Number(selectedBatch),
                start_month: startMonth,
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            const detail = err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || 'Enrollment failed. Student may already be enrolled in this course.';
            setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 animate-slide-up sm:animate-scale-in">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-heading">Quick Enroll</h2>
                        <p className="text-sm text-body-muted">{student.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <X className="w-5 h-5 text-body-muted" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1.5">Course *</label>
                        {loading ? (
                            <div className="w-full px-4 py-2.5 rounded-xl border border-default bg-input text-body-muted text-sm">Loading courses...</div>
                        ) : (
                            <div className="relative" ref={modalCourseRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowCourseDropdown((p) => !p)}
                                    className="w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 border border-default rounded-xl bg-input text-sm font-medium text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <span className="truncate">{selectedCourse ? (courses.find((c) => c.id === selectedCourse)?.name || 'Course') : 'Select a course'}</span>
                                    <ChevronDown className="w-4 h-4 text-body-muted shrink-0" />
                                </button>
                                {showCourseDropdown && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-default rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto animate-slide-down">
                                        {courses.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => { setSelectedCourse(c.id); setShowCourseDropdown(false); }}
                                                className={cn(
                                                    'w-full text-left px-4 py-2.5 text-sm transition-colors truncate',
                                                    selectedCourse === c.id
                                                        ? 'bg-primary text-primary-foreground font-medium'
                                                        : 'text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                                )}
                                            >
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-heading mb-1.5">Batch *</label>
                        <div className="relative" ref={modalBatchRef}>
                            <button
                                type="button"
                                onClick={() => selectedCourse && setShowBatchDropdown((p) => !p)}
                                className={cn(
                                    "w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 border border-default rounded-xl bg-input text-sm font-medium text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
                                    !selectedCourse && "opacity-50 cursor-not-allowed"
                                )}
                                disabled={!selectedCourse}
                            >
                                <span className="truncate">
                                    {selectedBatch ? (batches.find((b) => b.id === selectedBatch)?.name || 'Batch') : (selectedCourse ? 'Select a batch' : 'Select course first')}
                                </span>
                                <ChevronDown className="w-4 h-4 text-body-muted shrink-0" />
                            </button>
                            {showBatchDropdown && selectedCourse && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-default rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto animate-slide-down">
                                    {filteredBatches.map((b) => (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => { setSelectedBatch(b.id); setShowBatchDropdown(false); }}
                                            className={cn(
                                                'w-full text-left px-4 py-2.5 text-sm transition-colors truncate',
                                                selectedBatch === b.id
                                                    ? 'bg-primary text-primary-foreground font-medium'
                                                    : 'text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                            )}
                                        >
                                            <div className="font-semibold">{b.name}</div>
                                            <div className="text-[10px] opacity-70">{b.timing}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-heading mb-1.5">Start Month *</label>
                        <input
                            type="date"
                            value={startMonth}
                            onChange={(e) => setStartMonth(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20 text-sm"
                            required
                        />
                        <p className="text-xs text-body-muted mt-1">Pick the 1st of the month they start paying tuition.</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={submitting || !selectedBatch}>
                            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enrolling...</> : 'Enroll Student'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Enrollment Manager Modal ─────────────────────────────────────────────────

interface EnrollmentManagerProps {
    student: AdminStudent;
    onClose: () => void;
    onSuccess: () => void;
}

function EnrollmentManagerModal({ student, onClose, onSuccess }: EnrollmentManagerProps) {
    const [deactivating, setDeactivating] = useState<number | null>(null);
    const [error, setError] = useState('');

    const activeEnrollments = student.enrollments.filter((e) => e.is_active);
    const inactiveEnrollments = student.enrollments.filter((e) => !e.is_active);

    const handleDeactivate = async (enrollmentId: number) => {
        setDeactivating(enrollmentId);
        setError('');
        try {
            await adminApi.deactivateEnrollment(enrollmentId);
            onSuccess();
            onClose();
        } catch {
            setError('Failed to deactivate. Please try again.');
        } finally {
            setDeactivating(null);
        }
    };

    return (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg p-6 animate-slide-up sm:animate-scale-in max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-heading">Enrollments</h2>
                        <p className="text-sm text-body-muted">{student.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <X className="w-5 h-5 text-body-muted" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}

                {student.enrollments.length === 0 ? (
                    <div className="text-center py-8">
                        <ClipboardList className="w-10 h-10 mx-auto mb-3 text-body-subtle opacity-40" />
                        <p className="text-body-muted text-sm">No enrollment history</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeEnrollments.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-body-muted uppercase tracking-wider mb-2">Active</p>
                                <div className="space-y-2">
                                    {activeEnrollments.map((e) => {
                                        const color = courseColor(e.course_id);
                                        return (
                                            <div key={e.enrollment_id} className={cn(
                                                'flex items-center justify-between gap-3 p-3 rounded-xl border',
                                                color.bg, color.border
                                            )}>
                                                <div className="min-w-0">
                                                    <p className={cn('font-semibold text-sm truncate', color.text)}>{e.course_name}</p>
                                                    <p className="text-xs text-body-muted">{e.batch_name} · Since {formatMonth(e.start_month)} · ৳{Math.round(Number(e.effective_tuition_fee))}/mo</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeactivate(e.enrollment_id)}
                                                    disabled={deactivating === e.enrollment_id}
                                                    className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                                                >
                                                    {deactivating === e.enrollment_id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Deactivate'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {inactiveEnrollments.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-body-muted uppercase tracking-wider mb-2">History</p>
                                <div className="space-y-2">
                                    {inactiveEnrollments.map((e) => (
                                        <div key={e.enrollment_id} className="flex items-center gap-3 p-3 rounded-xl border border-default bg-neutral-50 dark:bg-neutral-900/30 opacity-60">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm text-heading truncate">{e.course_name}</p>
                                                <p className="text-xs text-body-muted">{e.batch_name} · {formatMonth(e.start_month)}</p>
                                            </div>
                                            <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                                                Inactive
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-4 mt-4 border-t border-default">
                    <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
                </div>
            </div>
        </div>
    );
}

// ─── Student Row (Desktop) ────────────────────────────────────────────────────

function StudentRow({
    student,
    onEnroll,
    onManage,
}: {
    student: AdminStudent;
    onEnroll: () => void;
    onManage: () => void;
}) {
    const activeEnrollments = student.enrollments.filter((e) => e.is_active);

    return (
        <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors border-b border-default group">
            {/* Student */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-lavender-100 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-300 flex items-center justify-center shrink-0">
                        <CircleUser className="w-5.5 h-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-heading text-sm leading-tight break-words">{student.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-body-muted">{student.age} yrs</span>
                        </div>
                    </div>
                </div>
            </td>

            {/* Parent */}
            <td className="px-4 py-3">
                <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium text-heading truncate max-w-[160px]">{student.parent_name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <a
                            href={`tel:${student.parent_phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors text-xs font-medium"
                        >
                            <Phone className="w-3 h-3" />
                            {student.parent_phone}
                        </a>
                        {student.parent_facebook && (
                            <a
                                href={student.parent_facebook}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-xs font-medium"
                            >
                                <Facebook className="w-3 h-3" />
                                FB
                            </a>
                        )}
                    </div>
                </div>
            </td>

            {/* Enrollments */}
            <td className="px-4 py-3">
                {activeEnrollments.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {activeEnrollments.map((e) => (
                            <EnrollmentBadge key={e.enrollment_id} enrollment={e} />
                        ))}
                    </div>
                ) : (
                    <button
                        onClick={onEnroll}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-primary/10 hover:text-primary transition-colors text-xs font-medium border border-dashed border-neutral-300 dark:border-neutral-600 hover:border-primary/40"
                    >
                        <Plus className="w-3 h-3" />
                        Enroll
                    </button>
                )}
            </td>

            {/* Since */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-xs text-body-muted whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {formatDate(student.created_at)}
                </div>
            </td>

            {/* Actions */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    <button
                        onClick={onManage}
                        className="p-2 rounded-xl hover:bg-lavender-100 dark:hover:bg-lavender-900/30 text-body-muted hover:text-lavender-600 dark:hover:text-lavender-400 transition-colors"
                        title="Manage enrollments"
                    >
                        <ClipboardList className="w-5 h-5" />
                    </button>
                    <Link
                        href={`/admin/users/${student.parent_id}`}
                        className="p-2 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-900/30 text-body-muted hover:text-secondary transition-colors"
                        title="View parent profile"
                    >
                        <UserIcon className="w-5 h-5" />
                    </Link>
                </div>
            </td>
        </tr>
    );
}

// ─── Student Card (Mobile) ────────────────────────────────────────────────────

function StudentCard({
    student,
    onEnroll,
    onManage,
}: {
    student: AdminStudent;
    onEnroll: () => void;
    onManage: () => void;
}) {
    const activeEnrollments = student.enrollments.filter((e) => e.is_active);

    return (
        <div className="p-4 border-b border-default last:border-0">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-lavender-100 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-300 flex items-center justify-center shrink-0">
                    <CircleUser className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                            <p className="font-bold text-heading break-words">{student.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs text-body-muted">{student.age} yrs</span>
                                <span className="text-xs text-body-muted font-medium shrink-0 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-body-subtle shrink-0" />
                                    {formatDate(student.created_at)}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <button
                                onClick={onManage}
                                className="p-2 rounded-xl hover:bg-lavender-100 dark:hover:bg-lavender-900/30 text-body-muted hover:text-lavender-600 transition-colors"
                                title="Manage enrollments"
                            >
                                <ClipboardList className="w-5 h-5" />
                            </button>
                            <Link
                                href={`/admin/users/${student.parent_id}`}
                                className="p-2 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-900/30 text-body-muted hover:text-secondary transition-colors"
                            >
                                <UserIcon className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Parent */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs font-medium text-heading">{student.parent_name}</span>
                        <a
                            href={`tel:${student.parent_phone}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 transition-colors text-xs font-medium"
                        >
                            <Phone className="w-3 h-3" />
                            {student.parent_phone}
                        </a>
                        {student.parent_facebook && (
                            <a
                                href={student.parent_facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors text-xs font-medium"
                            >
                                <Facebook className="w-3 h-3" />
                                FB
                            </a>
                        )}
                    </div>

                    {/* Enrollments */}
                    {activeEnrollments.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {activeEnrollments.map((e) => (
                                <EnrollmentBadge key={e.enrollment_id} enrollment={e} />
                            ))}
                        </div>
                    ) : (
                        <button
                            onClick={onEnroll}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-primary/10 hover:text-primary transition-colors text-xs font-medium border border-dashed border-neutral-300 dark:border-neutral-600"
                        >
                            <Plus className="w-3 h-3" />
                            Enroll to a Course
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SortField = 'name' | 'date_of_birth' | 'created_at';
type SortOrder = 'asc' | 'desc';
type EnrollmentStatus = 'all' | 'enrolled' | 'unenrolled';

export default function AdminStudentsPage() {
    // Data
    const [students, setStudents] = useState<AdminStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalCount, setTotalCount] = useState(0);

    // Filter input states (what user types/selects)
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
    const [selectedBatchId, setSelectedBatchId] = useState<number | ''>('');
    const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>('all');
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');

    // Toggle filters panel visibility
    const [showFilters, setShowFilters] = useState(false);

    // Sort
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    // Course dropdown popover
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);
    const courseDropdownRef = useRef<HTMLDivElement>(null);

    // Courses & Batches for dropdowns
    const [courses, setCourses] = useState<Course[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);

    // Modals
    const [enrollModal, setEnrollModal] = useState<AdminStudent | null>(null);
    const [manageModal, setManageModal] = useState<AdminStudent | null>(null);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Reset batch when course changes
    useEffect(() => {
        setSelectedBatchId('');
        if (!selectedCourseId) { setBatches([]); return; }
        adminApi.getBatches({ course: Number(selectedCourseId) })
            .then((r) => {
                const data = r.data.results || (r.data as any);
                setBatches(Array.isArray(data) ? data : []);
            })
            .catch(() => setBatches([]));
    }, [selectedCourseId]);

    // Fetch courses for dropdown
    useEffect(() => {
        adminApi.getCourses()
            .then((r) => {
                const data = r.data.results || (r.data as any);
                setCourses(Array.isArray(data) ? data : []);
            })
            .catch(() => {});
    }, []);

    // Build ordering string
    const ordering = `${sortOrder === 'desc' ? '-' : ''}${sortField}`;

    // Fetch students (filtered)
    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const params: Parameters<typeof adminApi.getAllStudents>[0] = {
                ordering,
            };
            if (searchQuery) params.search = searchQuery;
            if (selectedCourseId) params.course = Number(selectedCourseId);
            if (selectedBatchId) params.batch = Number(selectedBatchId);
            if (enrollmentStatus === 'enrolled') params.has_active_enrollment = 'true';
            if (enrollmentStatus === 'unenrolled') params.has_active_enrollment = 'false';
            if (minAge) params.min_age = Number(minAge);
            if (maxAge) params.max_age = Number(maxAge);

            const response = await adminApi.getAllStudents(params);
            const data = response.data;
            const list = Array.isArray(data) ? data : data.results || [];
            setStudents(list);
            setTotalCount(Array.isArray(data) ? list.length : (data.count ?? list.length));
        } catch (err: any) {
            setError('Failed to load students. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedCourseId, selectedBatchId, enrollmentStatus, minAge, maxAge, ordering]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
                setShowSortDropdown(false);
            }
            if (courseDropdownRef.current && !courseDropdownRef.current.contains(e.target as Node)) {
                setShowCourseDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Active filters for chips
    const activeFilters: { key: string; label: string; clear: () => void }[] = [];
    if (searchQuery) activeFilters.push({ key: 'search', label: `Search: "${searchQuery}"`, clear: () => { setSearchInput(''); setSearchQuery(''); } });
    if (selectedCourseId) {
        const c = courses.find((x) => x.id === Number(selectedCourseId));
        activeFilters.push({ key: 'course', label: `Course: ${c?.name ?? selectedCourseId}`, clear: () => setSelectedCourseId('') });
    }
    if (selectedBatchId) {
        const b = batches.find((x) => x.id === Number(selectedBatchId));
        activeFilters.push({ key: 'batch', label: `Batch: ${b?.name ?? selectedBatchId}`, clear: () => setSelectedBatchId('') });
    }
    if (enrollmentStatus !== 'all') activeFilters.push({ key: 'status', label: enrollmentStatus === 'enrolled' ? 'Enrolled Only' : 'Unenrolled Only', clear: () => setEnrollmentStatus('all') });
    if (minAge) activeFilters.push({ key: 'minAge', label: `Min Age: ${minAge}`, clear: () => setMinAge('') });
    if (maxAge) activeFilters.push({ key: 'maxAge', label: `Max Age: ${maxAge}`, clear: () => setMaxAge('') });

    const clearAllFilters = () => {
        setSearchInput(''); setSearchQuery('');
        setSelectedCourseId(''); setSelectedBatchId('');
        setEnrollmentStatus('all');
        setMinAge(''); setMaxAge('');
    };

    const sortLabels: Record<SortField, string> = { name: 'Name', date_of_birth: 'Age', created_at: 'Date Added' };

    return (
        <div className="space-y-5">
            {/* ── Main Card ───────────────────────────────────────────── */}
            <div className="bg-card rounded-2xl border border-default shadow-sm overflow-hidden">
                {/* ── Filters Header ───────────────────────────────────── */}
                <div className="p-4 border-b border-default space-y-3">
                    {/* Row 1: Search + Sort + Filter Toggle */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search student, parent..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20 text-sm"
                            />
                            {searchInput && (
                                <button
                                    onClick={() => { setSearchInput(''); setSearchQuery(''); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted hover:text-heading transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Actions (Sort + Filter Toggle) */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Sort Dropdown */}
                            <div className="relative" ref={sortDropdownRef}>
                                <button
                                    onClick={() => setShowSortDropdown((p) => !p)}
                                    className="inline-flex items-center gap-2 px-3 py-2.5 border border-default rounded-xl bg-input text-sm font-medium text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <ArrowUpDown className="w-4 h-4 text-body-muted" />
                                    <span className="hidden sm:inline">{sortLabels[sortField]}</span>
                                    <ChevronDown className="w-4 h-4 text-body-muted" />
                                </button>
                                {showSortDropdown && (
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-default rounded-xl shadow-lg z-10 overflow-hidden animate-slide-down">
                                        {(Object.keys(sortLabels) as SortField[]).map((f) => (
                                            <button
                                                key={f}
                                                onClick={() => { setSortField(f); setShowSortDropdown(false); }}
                                                className={cn(
                                                    'w-full text-left px-4 py-2 text-sm transition-colors',
                                                    sortField === f
                                                        ? 'bg-primary text-primary-foreground font-medium'
                                                        : 'text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                                )}
                                            >
                                                {sortLabels[f]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sort Order Toggle */}
                            <button
                                onClick={() => setSortOrder((p) => p === 'asc' ? 'desc' : 'asc')}
                                className="p-2.5 rounded-xl border border-default bg-input hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                            >
                                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-heading" /> : <ChevronDown className="w-4 h-4 text-heading" />}
                            </button>

                            {/* Filters Toggle Button */}
                            <button
                                onClick={() => setShowFilters((p) => !p)}
                                className={cn(
                                    'inline-flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors',
                                    showFilters
                                        ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                                        : 'bg-input border-default text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                )}
                                title="Toggle Filters"
                            >
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Filters</span>
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Filter options (Show/Hide) */}
                    {showFilters && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-default animate-slide-down">
                            {/* Course Dropdown (Styled like Sort dropdown) */}
                            <div className="relative" ref={courseDropdownRef}>
                                <button
                                    onClick={() => setShowCourseDropdown((p) => !p)}
                                    className="inline-flex items-center gap-2 px-3 py-2 border border-default rounded-xl bg-input text-sm font-medium text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <BookOpen className="w-4 h-4 text-body-muted" />
                                    <span>{selectedCourseId ? (courses.find((c) => c.id === selectedCourseId)?.name || 'Course') : 'All Courses'}</span>
                                    <ChevronDown className="w-4 h-4 text-body-muted" />
                                </button>
                                {showCourseDropdown && (
                                    <div className="absolute left-0 top-full mt-1 w-56 bg-card border border-default rounded-xl shadow-lg z-10 overflow-hidden max-h-60 overflow-y-auto animate-slide-down">
                                        <button
                                            onClick={() => { setSelectedCourseId(''); setShowCourseDropdown(false); }}
                                            className={cn(
                                                'w-full text-left px-4 py-2 text-sm transition-colors',
                                                !selectedCourseId
                                                    ? 'bg-primary text-primary-foreground font-medium'
                                                    : 'text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                            )}
                                        >
                                            All Courses
                                        </button>
                                        {courses.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => { setSelectedCourseId(c.id); setShowCourseDropdown(false); }}
                                                className={cn(
                                                    'w-full text-left px-4 py-2 text-sm transition-colors truncate',
                                                    selectedCourseId === c.id
                                                        ? 'bg-primary text-primary-foreground font-medium'
                                                        : 'text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                                )}
                                            >
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Batch — only show when course is selected */}
                            {selectedCourseId && batches.length > 0 && (
                                <select
                                    value={selectedBatchId}
                                    onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : '')}
                                    className="px-3 py-2 rounded-xl border border-default bg-input text-sm text-heading focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">All Batches</option>
                                    {batches.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            )}

                            {/* Enrollment status toggle */}
                            <div className="flex rounded-xl border border-default bg-input p-1 gap-0.5">
                                {(['all', 'enrolled', 'unenrolled'] as EnrollmentStatus[]).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setEnrollmentStatus(s)}
                                        className={cn(
                                            'px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors',
                                            enrollmentStatus === s
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'text-body-muted hover:text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                        )}
                                    >
                                        {s === 'all' ? 'All' : s === 'enrolled' ? 'Enrolled' : 'Unenrolled'}
                                    </button>
                                ))}
                            </div>

                            {/* Age range */}
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="number"
                                    value={minAge}
                                    onChange={(e) => setMinAge(e.target.value)}
                                    placeholder="Min age"
                                    min="1"
                                    max="30"
                                    className="w-20 px-2.5 py-2 rounded-xl border border-default bg-input text-sm text-heading focus:ring-2 focus:ring-primary/20 placeholder:text-body-muted"
                                />
                                <span className="text-body-muted text-xs">–</span>
                                <input
                                    type="number"
                                    value={maxAge}
                                    onChange={(e) => setMaxAge(e.target.value)}
                                    placeholder="Max age"
                                    min="1"
                                    max="30"
                                    className="w-20 px-2.5 py-2 rounded-xl border border-default bg-input text-sm text-heading focus:ring-2 focus:ring-primary/20 placeholder:text-body-muted"
                                />
                            </div>
                        </div>
                    )}

                    {/* Row 3: Active filter chips + result count */}
                    {(activeFilters.length > 0 || !loading) && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Result count */}
                            <span className="text-sm text-body-muted shrink-0">
                                {loading ? 'Loading…' : <><span className="font-semibold text-heading">{totalCount}</span> student{totalCount !== 1 ? 's' : ''}</>}
                            </span>

                            {/* Chips */}
                            {activeFilters.map((f) => (
                                <FilterChip key={f.key} label={f.label} onRemove={f.clear} />
                            ))}

                            {/* Clear all */}
                            {activeFilters.length > 1 && (
                                <button
                                    onClick={clearAllFilters}
                                    className="text-xs text-body-muted hover:text-heading underline transition-colors"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Content ──────────────────────────────────────────── */}
                {loading ? (
                    <>
                        {/* Mobile skeletons */}
                        <div className="md:hidden divide-y divide-default">
                            {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
                        </div>
                        {/* Desktop skeleton */}
                        <div className="hidden md:block">
                            <table className="w-full">
                                <tbody className="divide-y divide-default">
                                    {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <AlertCircle className="w-12 h-12 text-red-400" />
                        <p className="text-body-muted">{error}</p>
                        <Button variant="outline" onClick={fetchStudents} className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </Button>
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <GraduationCap className="w-12 h-12 text-body-subtle opacity-30 mb-4" />
                        <h3 className="text-lg font-semibold text-heading mb-2">
                            {activeFilters.length > 0 ? 'No students match your filters' : 'No students yet'}
                        </h3>
                        <p className="text-body-muted text-sm max-w-sm">
                            {activeFilters.length > 0
                                ? 'Try adjusting or clearing your filters.'
                                : 'Students will appear here once parents register and add them.'}
                        </p>
                        {activeFilters.length > 0 && (
                            <Button variant="outline" onClick={clearAllFilters} className="mt-4 gap-2">
                                <X className="w-4 h-4" />
                                Clear filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-default">
                            {students.map((s) => (
                                <StudentCard
                                    key={s.id}
                                    student={s}
                                    onEnroll={() => setEnrollModal(s)}
                                    onManage={() => setManageModal(s)}
                                />
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-default bg-neutral-50 dark:bg-neutral-900/50">
                                        {[
                                            { label: 'Student', w: 'w-[300px]' },
                                            { label: 'Parent', w: 'w-[300px]' },
                                            { label: 'Enrollments', w: '' },
                                            { label: 'Since', w: 'w-[110px]' },
                                            { label: '', w: 'w-[120px]' },
                                        ].map(({ label, w }) => (
                                            <th
                                                key={label}
                                                className={cn('px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wider', w)}
                                            >
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default">
                                    {students.map((s) => (
                                        <StudentRow
                                            key={s.id}
                                            student={s}
                                            onEnroll={() => setEnrollModal(s)}
                                            onManage={() => setManageModal(s)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* ── Modals ──────────────────────────────────────────────── */}
            {enrollModal && (
                <QuickEnrollModal
                    student={enrollModal}
                    onClose={() => setEnrollModal(null)}
                    onSuccess={() => { fetchStudents(); }}
                />
            )}
            {manageModal && (
                <EnrollmentManagerModal
                    student={manageModal}
                    onClose={() => setManageModal(null)}
                    onSuccess={() => { fetchStudents(); }}
                />
            )}
        </div>
    );
}
