'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    User as UserIcon,
    Phone,
    MapPin,
    Facebook,
    Mail,
    Calendar,
    GraduationCap,
    BookOpen,
    Pencil,
    Check,
    X,
    AlertCircle,
    Plus,
    ClipboardList,
    CircleUser,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/adminApi';
import { AdminStudent, Course, Batch, Student } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMonth(monthStr: string): string {
    if (!monthStr) return '';
    return new Date(monthStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
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
                                    <ChevronDownIcon className="w-4 h-4 text-body-muted shrink-0" />
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
                                <ChevronDownIcon className="w-4 h-4 text-body-muted shrink-0" />
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

function ChevronDownIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
    );
}

// ─── Edit Enrollment Modal ───────────────────────────────────────────────────

interface EditEnrollmentModalProps {
    student: AdminStudent;
    enrollment: AdminEnrollmentInfo;
    forceActivate?: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

function EditEnrollmentModal({ student, enrollment, forceActivate, onClose, onSuccess }: EditEnrollmentModalProps) {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<number>(enrollment.batch_id);
    const [startMonth, setStartMonth] = useState(enrollment.start_month);
    const [tuitionFee, setTuitionFee] = useState<string>(
        enrollment.tuition_fee !== null ? String(Math.round(Number(enrollment.tuition_fee))) : ''
    );
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showBatchDropdown, setShowBatchDropdown] = useState(false);
    const modalBatchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (modalBatchRef.current && !modalBatchRef.current.contains(e.target as Node)) {
                setShowBatchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        setLoadingBatches(true);
        adminApi.getBatches({ course: enrollment.course_id })
            .then((r) => {
                const data = r.data.results || (r.data as any);
                setBatches(Array.isArray(data) ? data : []);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoadingBatches(false));
    }, [enrollment.course_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const feeVal = tuitionFee.trim() === '' ? null : Number(tuitionFee);
            const payload: any = {
                batch: selectedBatch,
                start_month: startMonth,
                tuition_fee: feeVal,
            };
            if (forceActivate) {
                payload.is_active = true;
            }
            await adminApi.updateEnrollment(enrollment.enrollment_id, payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            const detail = err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || 'Failed to update enrollment.';
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
                        <h2 className="text-lg font-bold text-heading">
                            {forceActivate ? 'Reactivate Enrollment' : 'Edit Enrollment'}
                        </h2>
                        <p className="text-sm text-body-muted">{enrollment.course_name} · {student.name}</p>
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
                        <label className="block text-sm font-medium text-heading mb-1.5">Batch *</label>
                        {loadingBatches ? (
                            <div className="w-full px-4 py-2.5 rounded-xl border border-default bg-input text-body-muted text-sm">Loading batches...</div>
                        ) : (
                            <div className="relative" ref={modalBatchRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowBatchDropdown((p) => !p)}
                                    className="w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 border border-default rounded-xl bg-input text-sm font-medium text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <span className="truncate">
                                        {batches.find((b) => b.id === selectedBatch)?.name || 'Select a batch'}
                                    </span>
                                    <ChevronDownIcon className="w-4 h-4 text-body-muted shrink-0" />
                                </button>
                                {showBatchDropdown && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-default rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto animate-slide-down">
                                        {batches.map((b) => (
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
                        )}
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-heading mb-1.5">Tuition Fee (৳)</label>
                        <input
                            type="number"
                            value={tuitionFee}
                            onChange={(e) => setTuitionFee(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20 text-sm"
                            placeholder="Leave empty to use course/batch default"
                        />
                        <p className="text-xs text-body-muted mt-1">Leave blank to use default monthly fee.</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={submitting}>
                            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : (forceActivate ? 'Reactivate' : 'Save Changes')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Student Detail Page ──────────────────────────────────────────────────────

type EditableStudentField = 'name' | 'date_of_birth' | 'school' | 'current_class' | 'father_name' | 'mother_name';

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = Number(params.studentId);

    const [student, setStudent] = useState<AdminStudent | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingField, setEditingField] = useState<EditableStudentField | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [editEnrollmentModal, setEditEnrollmentModal] = useState<{
        isOpen: boolean;
        enrollment: AdminEnrollmentInfo | null;
        forceActivate: boolean;
    }>({
        isOpen: false,
        enrollment: null,
        forceActivate: false
    });

    const handleOpenEditModal = (enrollment: AdminEnrollmentInfo, forceActivate: boolean = false) => {
        setEditEnrollmentModal({
            isOpen: true,
            enrollment,
            forceActivate
        });
    };

    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        field: EditableStudentField | null;
        finalValue: string;
    }>({
        isOpen: false,
        field: null,
        finalValue: ''
    });

    const [deactivateModalState, setDeactivateModalState] = useState<{
        isOpen: boolean;
        enrollment: AdminEnrollmentInfo | null;
    }>({
        isOpen: false,
        enrollment: null
    });

    const startEditing = (field: EditableStudentField, value: string) => {
        setEditingField(field);
        setEditValue(value || '');
        setValidationError(null);
    };

    const cancelEditing = () => {
        setEditingField(null);
        setEditValue('');
        setValidationError(null);
    };

    const handleSave = (field: EditableStudentField) => {
        if (!student) return;
        setValidationError(null);

        const trimmedValue = editValue.trim();

        if (field === 'name' && !trimmedValue) {
            setValidationError('Name cannot be empty.');
            return;
        }

        if (field === 'date_of_birth' && !trimmedValue) {
            setValidationError('Date of birth is required.');
            return;
        }

        const oldValue = student[field] || '';
        if (oldValue === trimmedValue) {
            cancelEditing();
            return;
        }

        setConfirmModalState({
            isOpen: true,
            field,
            finalValue: trimmedValue
        });
    };

    const executeSave = async () => {
        const { field, finalValue } = confirmModalState;
        if (!student || !field) return;

        try {
            setSaving(true);
            const response = await adminApi.updateStudent(student.id, { [field]: finalValue });
            setStudent(response.data);
            setEditingField(null);
            setConfirmModalState({ isOpen: false, field: null, finalValue: '' });
        } catch (err: any) {
            console.error('Failed to update student:', err);
            const backendErrors = err.response?.data;
            if (backendErrors && typeof backendErrors === 'object') {
                const firstError = Object.values(backendErrors)[0];
                setValidationError(Array.isArray(firstError) ? firstError[0] : 'Validation failed.');
            } else {
                setValidationError('Failed to update field.');
            }
            setConfirmModalState({ isOpen: false, field: null, finalValue: '' });
        } finally {
            setSaving(false);
        }
    };

    const cancelSave = () => {
        setConfirmModalState({ isOpen: false, field: null, finalValue: '' });
        cancelEditing();
    };

    const handleDeactivateClick = (enrollment: AdminEnrollmentInfo) => {
        setDeactivateModalState({
            isOpen: true,
            enrollment
        });
    };

    const executeDeactivate = async () => {
        const enrollment = deactivateModalState.enrollment;
        if (!enrollment) return;
        try {
            setDeactivatingId(enrollment.enrollment_id);
            await adminApi.deactivateEnrollment(enrollment.enrollment_id);
            setDeactivateModalState({ isOpen: false, enrollment: null });
            fetchData();
        } catch (err) {
            console.error('Failed to deactivate enrollment:', err);
        } finally {
            setDeactivatingId(null);
        }
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const studentResponse = await adminApi.getStudent(studentId);
            setStudent(studentResponse.data);
        } catch (err) {
            console.error('Failed to load student details:', err);
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="text-center py-12">
                <p className="text-body-muted">Student not found</p>
                <Button
                    variant="ghost"
                    onClick={() => router.push('/admin/students')}
                    className="mt-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Students
                </Button>
            </div>
        );
    }

    const activeEnrollments = student.enrollments.filter(e => e.is_active);
    const inactiveEnrollments = student.enrollments.filter(e => !e.is_active);

    return (
        <div className="space-y-6">
            {/* Breadcrumb and Header */}
            <div>
                <Link
                    href="/admin/students"
                    className="inline-flex items-center gap-2 text-sm text-body-muted hover:text-primary transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Students
                </Link>
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full flex items-center justify-center shrink-0 bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400">
                            <CircleUser className="h-8 w-8" />
                        </div>
                        <div>
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                                {editingField === 'name' ? (
                                    <div className="flex flex-col gap-2 w-full max-w-[240px]">
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => {
                                                setEditValue(e.target.value);
                                                setValidationError(null);
                                            }}
                                            className="w-full px-2 py-1.5 border border-default rounded-lg text-lg font-bold bg-input focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSave('name');
                                                if (e.key === 'Escape') cancelEditing();
                                            }}
                                        />
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={cancelEditing} 
                                                disabled={saving}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-md font-medium transition-colors shrink-0"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                <span>Cancel</span>
                                            </button>
                                            <button 
                                                onClick={() => handleSave('name')} 
                                                disabled={saving}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-md font-medium transition-colors shrink-0"
                                            >
                                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                <span>Save</span>
                                            </button>
                                        </div>
                                        {validationError && (
                                            <span className="text-xs text-red-500 font-normal">{validationError}</span>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl font-bold text-heading">{student.name}</h1>
                                        <button
                                            onClick={() => startEditing('name', student.name)}
                                            className="p-1 text-body-muted hover:text-heading hover:bg-surface rounded-lg transition-colors"
                                            title="Edit Name"
                                        >
                                            <Pencil className="w-4 h-4 shrink-0" />
                                        </button>
                                    </>
                                )}
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-lavender-100 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-400 text-xs font-medium">
                                    <GraduationCap className="w-3.5 h-3.5" />
                                    Student
                                </span>
                            </div>
                            <p className="text-body-muted flex items-center gap-1 text-sm">
                                <span className="font-medium">Student ID:</span> {student.id}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columns: Student Information & Parent Information */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Merged Card: Student & Parent Information */}
                    <div className="bg-card rounded-2xl border border-default shadow-sm p-6 space-y-6">
                        <h2 className="text-lg font-semibold text-heading border-b border-default pb-3">
                            Student Information
                        </h2>

                        <div className="space-y-4">
                            {/* Date of Birth */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary rounded-lg shrink-0">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-body-muted mb-0.5">Date of Birth</p>
                                    {editingField === 'date_of_birth' ? (
                                        <div className="flex flex-col gap-2 mt-1 w-full">
                                            <input
                                                type="date"
                                                value={editValue}
                                                onChange={(e) => {
                                                    setEditValue(e.target.value);
                                                    setValidationError(null);
                                                }}
                                                className="w-full px-2 py-1.5 text-sm border border-default rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSave('date_of_birth');
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                            />
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={cancelEditing} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span>Cancel</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleSave('date_of_birth')} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    <span>Save</span>
                                                </button>
                                            </div>
                                            {validationError && (
                                                <span className="text-xs text-red-500 font-medium">{validationError}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-heading">
                                                {formatDate(student.date_of_birth)} <span className="text-xs text-body-muted font-normal">({student.age} yrs)</span>
                                            </p>
                                            <button
                                                onClick={() => startEditing('date_of_birth', student.date_of_birth || '')}
                                                className="p-1 text-body-muted hover:text-heading hover:bg-surface rounded-lg transition-colors"
                                                title="Edit Date of Birth"
                                            >
                                                <Pencil className="w-3.5 h-3.5 shrink-0" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* School */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary rounded-lg shrink-0">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-body-muted mb-0.5">School</p>
                                    {editingField === 'school' ? (
                                        <div className="flex flex-col gap-2 mt-1 w-full">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => {
                                                    setEditValue(e.target.value);
                                                    setValidationError(null);
                                                }}
                                                className="w-full px-2 py-1.5 text-sm border border-default rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                autoFocus
                                                placeholder="Enter school name"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSave('school');
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                            />
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={cancelEditing} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span>Cancel</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleSave('school')} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    <span>Save</span>
                                                </button>
                                            </div>
                                            {validationError && (
                                                <span className="text-xs text-red-500 font-medium">{validationError}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className={cn("font-medium truncate", student.school ? "text-heading" : "text-body-subtle italic text-sm")}>
                                                {student.school || 'No school provided'}
                                            </p>
                                            <button
                                                onClick={() => startEditing('school', student.school || '')}
                                                className="p-1 text-body-muted hover:text-heading hover:bg-surface rounded-lg transition-colors"
                                                title="Edit School"
                                            >
                                                <Pencil className="w-3.5 h-3.5 shrink-0" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Class */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary rounded-lg shrink-0">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-body-muted mb-0.5">Class</p>
                                    {editingField === 'current_class' ? (
                                        <div className="flex flex-col gap-2 mt-1 w-full">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => {
                                                    setEditValue(e.target.value);
                                                    setValidationError(null);
                                                }}
                                                className="w-full px-2 py-1.5 text-sm border border-default rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                autoFocus
                                                placeholder="Enter class (e.g. Class 10)"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSave('current_class');
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                            />
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={cancelEditing} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span>Cancel</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleSave('current_class')} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    <span>Save</span>
                                                </button>
                                            </div>
                                            {validationError && (
                                                <span className="text-xs text-red-500 font-medium">{validationError}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className={cn("font-medium truncate", student.current_class ? "text-heading" : "text-body-subtle italic text-sm")}>
                                                {student.current_class || 'No class provided'}
                                            </p>
                                            <button
                                                onClick={() => startEditing('current_class', student.current_class || '')}
                                                className="p-1 text-body-muted hover:text-heading hover:bg-surface rounded-lg transition-colors"
                                                title="Edit Class"
                                            >
                                                <Pencil className="w-3.5 h-3.5 shrink-0" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Father's Name */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary rounded-lg shrink-0">
                                    <UserIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-body-muted mb-0.5">Father's Name</p>
                                    {editingField === 'father_name' ? (
                                        <div className="flex flex-col gap-2 mt-1 w-full">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => {
                                                    setEditValue(e.target.value);
                                                    setValidationError(null);
                                                }}
                                                className="w-full px-2 py-1.5 text-sm border border-default rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                autoFocus
                                                placeholder="Enter father's name"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSave('father_name');
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                            />
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={cancelEditing} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span>Cancel</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleSave('father_name')} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    <span>Save</span>
                                                </button>
                                            </div>
                                            {validationError && (
                                                <span className="text-xs text-red-500 font-medium">{validationError}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className={cn("font-medium truncate", student.father_name ? "text-heading" : "text-body-subtle italic text-sm")}>
                                                {student.father_name || 'No father name provided'}
                                            </p>
                                            <button
                                                onClick={() => startEditing('father_name', student.father_name || '')}
                                                className="p-1 text-body-muted hover:text-heading hover:bg-surface rounded-lg transition-colors"
                                                title="Edit Father's Name"
                                            >
                                                <Pencil className="w-3.5 h-3.5 shrink-0" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mother's Name */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary rounded-lg shrink-0">
                                    <UserIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-body-muted mb-0.5">Mother's Name</p>
                                    {editingField === 'mother_name' ? (
                                        <div className="flex flex-col gap-2 mt-1 w-full">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => {
                                                    setEditValue(e.target.value);
                                                    setValidationError(null);
                                                }}
                                                className="w-full px-2 py-1.5 text-sm border border-default rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                autoFocus
                                                placeholder="Enter mother's name"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSave('mother_name');
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                            />
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={cancelEditing} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span>Cancel</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleSave('mother_name')} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    <span>Save</span>
                                                </button>
                                            </div>
                                            {validationError && (
                                                <span className="text-xs text-red-500 font-medium">{validationError}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className={cn("font-medium truncate", student.mother_name ? "text-heading" : "text-body-subtle italic text-sm")}>
                                                {student.mother_name || 'No mother name provided'}
                                            </p>
                                            <button
                                                onClick={() => startEditing('mother_name', student.mother_name || '')}
                                                className="p-1 text-body-muted hover:text-heading hover:bg-surface rounded-lg transition-colors"
                                                title="Edit Mother's Name"
                                            >
                                                <Pencil className="w-3.5 h-3.5 shrink-0" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Parent Phone */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary rounded-lg shrink-0">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-body-muted mb-0.5">Parent Phone</p>
                                    <p className="font-medium text-heading">{student.parent_phone}</p>
                                </div>
                            </div>

                            {/* Parent Address */}
                            {student.parent_address && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary rounded-lg shrink-0">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-body-muted mb-0.5">Address</p>
                                        <p className="font-medium text-heading">{student.parent_address}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Merged Actions */}
                        <div className="pt-4 border-t border-default space-y-3">
                            <a 
                                href={`tel:${student.parent_phone}`} 
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200/80 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors font-medium"
                            >
                                <Phone className="w-5 h-5 shrink-0" />
                                Call Parent
                            </a>

                            {student.parent_facebook && (
                                <a 
                                    href={student.parent_facebook} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-xl transition-colors font-medium"
                                >
                                    <Facebook className="w-5 h-5 shrink-0" />
                                    View Facebook Profile
                                </a>
                            )}

                            <Link 
                                href={`/admin/users/${student.parent_id}`}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200/85 dark:bg-neutral-900/30 dark:hover:bg-neutral-900/50 text-heading rounded-xl transition-colors font-medium"
                            >
                                <UserIcon className="w-5 h-5 shrink-0" />
                                View Parent Detail
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Card 3: Enrollments Card (Right Column) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card rounded-2xl border border-default shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-default flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-heading mb-1">Course Enrollments</h2>
                                <p className="text-sm text-body-muted">Manage active and historical enrollments</p>
                            </div>
                            <Button 
                                onClick={() => setEnrollModalOpen(true)}
                                variant="outline"
                                className="gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Enroll
                            </Button>
                        </div>
                        <div className="p-6 space-y-8">
                            {/* Active Enrollments */}
                            <div>
                                <h3 className="text-xs font-semibold text-body-muted uppercase tracking-wider mb-3">Active</h3>
                                {activeEnrollments.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeEnrollments.map((e) => {
                                            const color = courseColor(e.course_id);
                                            return (
                                                <div 
                                                    key={e.enrollment_id} 
                                                    className={cn(
                                                        'flex flex-col justify-between border rounded-2xl p-6 shadow-sm relative group bg-neutral-50/50 dark:bg-neutral-900/20 space-y-4',
                                                        color.border
                                                    )}
                                                >
                                                    <div className="space-y-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <span className={cn(
                                                                'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border',
                                                                color.bg, color.text, color.border
                                                            )}>
                                                                {e.course_name}
                                                            </span>
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                                Active
                                                            </span>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <h4 className="font-bold text-heading text-lg mb-1">{e.batch_name}</h4>
                                                            <p className="text-sm text-body-muted flex flex-col gap-1.5">
                                                                {e.batch_timing && (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <Clock className="w-4 h-4 text-body-muted shrink-0" />
                                                                        <span><span className="font-semibold text-heading">Timing:</span> {e.batch_timing}</span>
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1.5">
                                                                    <Calendar className="w-4 h-4 text-body-muted shrink-0" />
                                                                    <span><span className="font-semibold text-heading">Start Month:</span> {formatMonth(e.start_month)}</span>
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <span className="text-body-muted font-bold text-sm shrink-0 w-4 text-center">৳</span>
                                                                    <span><span className="font-semibold text-heading">Tuition Fee:</span> ৳{Math.round(Number(e.effective_tuition_fee))}/mo</span>
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 pt-4 border-t border-default/50 flex justify-end gap-2.5">
                                                        <button
                                                            onClick={() => handleDeactivateClick(e)}
                                                            disabled={deactivatingId === e.enrollment_id}
                                                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                                                        >
                                                            {deactivatingId === e.enrollment_id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                'Deactivate'
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEditModal(e)}
                                                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-heading transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border border-dashed border-default rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/10">
                                        <GraduationCap className="w-10 h-10 mx-auto text-body-subtle opacity-30 mb-2" />
                                        <p className="text-body-muted text-xs font-medium">No active course enrollments.</p>
                                    </div>
                                )}
                            </div>

                            {/* Inactive History */}
                            {inactiveEnrollments.length > 0 && (
                                <div className="pt-2">
                                    <h3 className="text-xs font-semibold text-body-muted uppercase tracking-wider mb-3">History</h3>
                                    <div className="space-y-3">
                                        {inactiveEnrollments.map((e) => (
                                            <div 
                                                key={e.enrollment_id} 
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-default bg-neutral-50/50 dark:bg-neutral-900/10"
                                            >
                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm text-heading">{e.course_name}</span>
                                                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 uppercase tracking-wider">
                                                            Inactive
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-body-muted">
                                                        {e.batch_name} • {formatMonth(e.start_month)} • ৳{Math.round(Number(e.effective_tuition_fee))}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenEditModal(e, true)}
                                                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors shrink-0"
                                                >
                                                    Reactivate
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal for updates */}
            {confirmModalState.isOpen && (
                <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-md rounded-2xl border border-default shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-heading mb-2">Confirm Update</h3>
                            <p className="text-body-muted mb-6">
                                Are you sure you want to update the <span className="font-semibold text-heading capitalize">{confirmModalState.field?.replace('_', ' ')}</span>?
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3 mb-6 bg-surface rounded-xl p-4 border border-default">
                                <div>
                                    <p className="text-xs text-body-subtle mb-1">Old Value</p>
                                    <p className="text-sm font-medium text-body-muted break-all">
                                        {confirmModalState.field === 'date_of_birth' ? (
                                            student ? formatDate(student.date_of_birth) : ''
                                        ) : (
                                            student?.[confirmModalState.field!] || <span className="italic text-body-subtle">Empty</span>
                                        )}
                                    </p>
                                </div>
                                <div className="border-l border-default pl-3">
                                    <p className="text-xs text-body-subtle mb-1">New Value</p>
                                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 break-all">
                                        {confirmModalState.field === 'date_of_birth' ? (
                                            formatDate(confirmModalState.finalValue)
                                        ) : (
                                            confirmModalState.finalValue || <span className="italic text-red-500 font-medium">To be cleared</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={cancelSave}
                                    disabled={saving}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-heading transition-colors"
                                >
                                    Cancel
                                </button>

                                <Button
                                    onClick={executeSave}
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary-hover text-primary-foreground"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Confirm Update'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Enroll Modal */}
            {enrollModalOpen && (
                <QuickEnrollModal
                    student={student}
                    onClose={() => setEnrollModalOpen(false)}
                    onSuccess={() => { fetchData(); }}
                />
            )}

            {/* Edit/Activate Enrollment Modal */}
            {editEnrollmentModal.isOpen && editEnrollmentModal.enrollment && (
                <EditEnrollmentModal
                    student={student}
                    enrollment={editEnrollmentModal.enrollment}
                    forceActivate={editEnrollmentModal.forceActivate}
                    onClose={() => setEditEnrollmentModal({ isOpen: false, enrollment: null, forceActivate: false })}
                    onSuccess={() => { fetchData(); }}
                />
            )}

            {/* Deactivation Confirmation Modal */}
            {deactivateModalState.isOpen && deactivateModalState.enrollment && (
                <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDeactivateModalState({ isOpen: false, enrollment: null })} />
                    <div className="relative bg-card w-full max-w-md rounded-2xl border border-default shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 z-10">
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                                <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded-xl">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-heading">Deactivate Enrollment</h3>
                            </div>
                            
                            <p className="text-sm text-body-muted mb-6">
                                Are you sure you want to deactivate the enrollment for <span className="font-semibold text-heading">{deactivateModalState.enrollment.course_name}</span>? <span className="font-semibold text-heading">{student.name}</span> will no longer be active in <span className="font-semibold text-heading">{deactivateModalState.enrollment.batch_name}</span>.
                            </p>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setDeactivateModalState({ isOpen: false, enrollment: null })}
                                    disabled={deactivatingId !== null}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-heading transition-colors"
                                >
                                    Cancel
                                </button>
                                <Button
                                    onClick={executeDeactivate}
                                    disabled={deactivatingId !== null}
                                    className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-900/60 dark:hover:bg-red-900/80 rounded-xl"
                                >
                                    {deactivatingId !== null ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Deactivating...
                                        </>
                                    ) : (
                                        'Yes, Deactivate'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
