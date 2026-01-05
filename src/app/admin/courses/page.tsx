'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
    BookOpen,
    Plus,
    Edit2,
    Trash2,
    Users,
    ChevronRight,
    ChevronDown,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    Lock,
    Unlock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { courseApi } from '@/lib/api';
import { Course, Batch } from '@/types';
import { cn } from '@/lib/utils';

import { adminApi } from '@/lib/adminApi';

// Course Form Modal Component
interface CourseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CourseFormData) => Promise<void>;
    initialData?: Course | null;
    isSubmitting: boolean;
}

interface CourseFormData {
    name: string;
    description: string;
    admission_fee: number;
    monthly_fee: number;
    is_active: boolean;
}

function CourseFormModal({ isOpen, onClose, onSubmit, initialData, isSubmitting }: CourseFormModalProps) {
    const [formData, setFormData] = useState<CourseFormData>({
        name: '',
        description: '',
        admission_fee: 0,
        monthly_fee: 0,
        is_active: true,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || '',
                admission_fee: initialData.admission_fee,
                monthly_fee: initialData.monthly_fee,
                is_active: initialData.is_active,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                admission_fee: 0,
                monthly_fee: 0,
                is_active: true,
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-card rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
                <h2 className="text-xl font-bold text-heading mb-4">
                    {initialData ? 'Edit Course' : 'Add New Course'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Course Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter course name"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                            placeholder="Enter course description"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-heading mb-1">
                                Admission Fee (৳) *
                            </label>
                            <input
                                type="number"
                                value={formData.admission_fee}
                                onChange={(e) => setFormData({ ...formData, admission_fee: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-heading mb-1">
                                Monthly Fee (৳) *
                            </label>
                            <input
                                type="number"
                                value={formData.monthly_fee}
                                onChange={(e) => setFormData({ ...formData, monthly_fee: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>
                    
                    <ToggleSwitch
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        label="Course is active"
                    />
                    
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : initialData ? (
                                'Save Changes'
                            ) : (
                                'Add Course'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Batch Form Modal Component
interface BatchFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: BatchFormData) => Promise<void>;
    initialData?: Batch | null;
    courseId: number;
    isSubmitting: boolean;
}

interface BatchFormData {
    name: string;
    timing: string;
    group_link: string;
    class_link: string;
    tuition_fee: number | null;
    is_visible: boolean;
}

function BatchFormModal({ isOpen, onClose, onSubmit, initialData, courseId, isSubmitting }: BatchFormModalProps) {
    const [formData, setFormData] = useState<BatchFormData>({
        name: '',
        timing: '',
        group_link: '',
        class_link: '',
        tuition_fee: null,
        is_visible: true,
    });
    const [useCourseFee, setUseCourseFee] = useState(true);

    useEffect(() => {
        if (initialData) {
            const hasBatchFee = initialData.tuition_fee !== null && initialData.tuition_fee !== undefined;
            setFormData({
                name: initialData.name,
                timing: initialData.timing,
                group_link: initialData.group_link || '',
                class_link: initialData.class_link || '',
                tuition_fee: initialData.tuition_fee ?? null,
                is_visible: initialData.is_visible,
            });
            setUseCourseFee(!hasBatchFee);
        } else {
            setFormData({
                name: '',
                timing: '',
                group_link: '',
                class_link: '',
                tuition_fee: null,
                is_visible: true,
            });
            setUseCourseFee(true);
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitData: BatchFormData = {
            ...formData,
            tuition_fee: useCourseFee ? null : formData.tuition_fee,
        };
        await onSubmit(submitData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-card rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-heading mb-4">
                    {initialData ? 'Edit Batch' : 'Add New Batch'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Batch Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            placeholder="e.g., Evening Batch A"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Timing *
                        </label>
                        <input
                            type="text"
                            value={formData.timing}
                            onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            placeholder="e.g., Mon-Wed 5:00 PM - 6:30 PM"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Group Link
                        </label>
                        <input
                            type="url"
                            value={formData.group_link}
                            onChange={(e) => setFormData({ ...formData, group_link: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            placeholder="https://..."
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Class Link
                        </label>
                        <input
                            type="url"
                            value={formData.class_link}
                            onChange={(e) => setFormData({ ...formData, class_link: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            placeholder="https://..."
                        />
                    </div>
                    
                    <div>
                        <ToggleSwitch
                            id="use_course_fee"
                            checked={useCourseFee}
                            onChange={(checked) => setUseCourseFee(checked)}
                            label="Use course-level tuition fee"
                        />
                        
                        {!useCourseFee && (
                            <div>
                                <label className="block text-sm font-medium text-heading mb-1">
                                    Batch Tuition Fee (৳)
                                </label>
                                <input
                                    type="number"
                                    value={formData.tuition_fee ?? ''}
                                    onChange={(e) => setFormData({ ...formData, tuition_fee: e.target.value ? Number(e.target.value) : null })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter batch-specific fee"
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-4">
                        <ToggleSwitch
                            id="is_visible"
                            checked={formData.is_visible}
                            onChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                            label="Open for enrollment"
                        />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : initialData ? (
                                'Save Changes'
                            ) : (
                                'Add Batch'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Delete Confirmation Modal
interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => Promise<void>;
    title: string;
    message: string;
    isDeleting: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    showConfirm?: boolean;
}

function DeleteModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    isDeleting,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    showConfirm = true
}: DeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
                <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                        "p-3 rounded-full",
                        showConfirm ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                    )}>
                        <AlertCircle className={cn(
                            "w-6 h-6",
                            showConfirm ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                        )} />
                    </div>
                    <h2 className="text-xl font-bold text-heading">{title}</h2>
                </div>
                
                <p className="text-body-muted mb-6 whitespace-pre-line">{message}</p>
                
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isDeleting}
                    >
                        {cancelLabel}
                    </Button>
                    {showConfirm && onConfirm && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onConfirm}
                            className="flex-1"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                confirmLabel
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Course Card Component
interface CourseCardProps {
    course: Course;
    onEdit: () => void;
    onDelete: () => void;
    onAddBatch: () => void;
    onEditBatch: (batch: Batch) => void;
    onDeleteBatch: (batch: Batch) => void;
    onRefresh: () => void;
}

function CourseCard({ 
    course, 
    onEdit, 
    onDelete,
    onAddBatch,
    onEditBatch,
    onDeleteBatch,
    onRefresh,
}: CourseCardProps) {
    const totalStudents = course.batches?.reduce((sum, b) => sum + (b.student_count || 0), 0) || 0;
    
    // Sort batches by name, then by timing
    const sortedBatches = useMemo(() => {
        if (!course.batches) return [];
        return [...course.batches].sort((a, b) => {
            const nameCompare = a.name.localeCompare(b.name);
            if (nameCompare !== 0) return nameCompare;
            return a.timing.localeCompare(b.timing);
        });
    }, [course.batches]);
    
    // Toggle batch enrollment status
    const handleToggleBatchEnrollment = async (batch: Batch) => {
        try {
            await adminApi.updateBatch(batch.id, {
                ...batch,
                is_visible: !batch.is_visible,
            });
            onRefresh();
        } catch (err: any) {
            console.error('Error toggling enrollment:', err);
        }
    };
    
    return (
        <div className={cn(
            'bg-card rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden',
            course.is_active 
                ? 'border-neutral-200 dark:border-neutral-700' 
                : 'border-neutral-200 dark:border-neutral-700 opacity-75'
        )}>
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-default">
                {/* Left Side: Course Info */}
                <div className="p-5">
                    {/* Header with title and actions */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                'p-2.5 rounded-xl shrink-0',
                                course.is_active 
                                    ? 'bg-secondary-100 dark:bg-secondary-900/40' 
                                    : 'bg-neutral-100 dark:bg-neutral-800'
                            )}>
                                <BookOpen className={cn(
                                    'w-5 h-5',
                                    course.is_active 
                                        ? 'text-secondary' 
                                        : 'text-neutral-500'
                                )} />
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="text-lg font-bold text-heading">
                                        {course.name}
                                    </h3>
                                    {!course.is_active && (
                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                
                                {course.description && (
                                    <p className="text-sm text-body-muted line-clamp-2">
                                        {course.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onClick={onEdit}
                                className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-900/30 text-body-muted hover:text-secondary transition-colors"
                                title="Edit course"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onDelete}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-body-muted hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Delete course"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Stats grid - neutral colors */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                            <p className="text-xs text-body-muted mb-0.5">Admission Fee</p>
                            <p className="font-semibold text-heading">৳{Math.round(course.admission_fee)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                            <p className="text-xs text-body-muted mb-0.5">Monthly Fee</p>
                            <p className="font-semibold text-heading">৳{Math.round(course.monthly_fee)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                            <p className="text-xs text-body-muted mb-0.5">Students</p>
                            <p className="font-semibold text-heading flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-body-muted" />
                                {totalStudents}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                            <p className="text-xs text-body-muted mb-0.5">Batches</p>
                            <p className="font-semibold text-heading">{course.batches?.length || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Batches List */}
                <div className="flex flex-col bg-neutral-50/50 dark:bg-neutral-900/20">
                    <div className="p-3 border-b border-default flex items-center justify-between bg-card">
                        <h4 className="font-semibold text-heading text-sm">Batches</h4>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onAddBatch}
                            className="h-7 px-3 text-xs"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Batch
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[220px] p-2 custom-scrollbar">
                        {sortedBatches.length > 0 ? (
                            <div className="space-y-1.5">
                                {sortedBatches.map((batch) => (
                                    <div
                                        key={batch.id}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-neutral-200 dark:border-neutral-700 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-sm transition-all group"
                                    >
                                        <Link
                                            href={`/admin/courses/${course.id}/batches/${batch.id}`}
                                            className="flex-1 min-w-0 mr-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                {!batch.is_visible && (
                                                    <span title="Closed for enrollment" className="flex items-center">
                                                        <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    </span>
                                                )}
                                                <span className="font-medium text-heading group-hover:text-primary transition-colors truncate text-sm">
                                                    {batch.name}
                                                </span>
                                            </div>
                                            <p className="text-xs text-body-muted truncate mt-0.5">
                                                {batch.timing} • {batch.student_count || 0} students
                                            </p>
                                        </Link>
                                        
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                onClick={() => handleToggleBatchEnrollment(batch)}
                                                className={cn(
                                                    'p-1.5 rounded-lg transition-colors',
                                                    batch.is_visible
                                                        ? 'hover:bg-amber-100 dark:hover:bg-amber-900/30 text-body-muted hover:text-amber-600'
                                                        : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-body-muted hover:text-emerald-600'
                                                )}
                                                title={batch.is_visible ? 'Close enrollment' : 'Open enrollment'}
                                            >
                                                {batch.is_visible ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                            </button>
                                            <button
                                                onClick={() => onEditBatch(batch)}
                                                className="p-1.5 rounded-lg hover:bg-lavender-100 dark:hover:bg-lavender-900/30 text-body-muted hover:text-lavender-600 dark:hover:text-lavender-400 transition-colors"
                                                title="Edit batch"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteBatch(batch)}
                                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-body-muted hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                title="Delete batch"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-6 text-body-muted">
                                <BookOpen className="w-7 h-7 mb-2 opacity-20" />
                                <p className="text-sm">No batches yet</p>
                                <Button
                                    size="sm"
                                    variant="link"
                                    onClick={onAddBatch}
                                    className="text-secondary mt-1 h-auto p-0 text-xs"
                                >
                                    Create one
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main Courses Page
export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Course Modal State
    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [isSavingCourse, setIsSavingCourse] = useState(false);
    
    // Batch Modal State
    const [batchModalOpen, setBatchModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [isSavingBatch, setIsSavingBatch] = useState(false);
    
    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<{ 
        type: 'course' | 'batch'; 
        id: number; 
        name: string;
        studentCount?: number;
        batchCount?: number;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            const response = await courseApi.getCourses();
            // Handle both paginated response (results array) and direct array response
            const coursesData = response.data.results || response.data;
            setCourses(Array.isArray(coursesData) ? coursesData : []);
        } catch (err: any) {
            console.error('Error fetching courses:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);



    // Course CRUD handlers
    const handleAddCourse = () => {
        setEditingCourse(null);
        setCourseModalOpen(true);
    };

    const handleEditCourse = (course: Course) => {
        setEditingCourse(course);
        setCourseModalOpen(true);
    };

    const handleDeleteCourse = (course: Course) => {
        setDeletingItem({ 
            type: 'course', 
            id: course.id, 
            name: course.name,
            batchCount: course.batches?.length || 0
        });
        setDeleteModalOpen(true);
    };

    const handleCourseSubmit = async (data: CourseFormData) => {
        try {
            setIsSavingCourse(true);
            if (editingCourse) {
                await adminApi.updateCourse(editingCourse.id, data);
            } else {
                await adminApi.createCourse(data);
            }
            setCourseModalOpen(false);
            fetchCourses();
        } catch (err: any) {
            console.error('Error saving course:', err);
        } finally {
            setIsSavingCourse(false);
        }
    };

    // Batch CRUD handlers
    const handleAddBatch = (courseId: number) => {
        setSelectedCourseId(courseId);
        setEditingBatch(null);
        setBatchModalOpen(true);
    };

    const handleEditBatch = (batch: Batch, courseId: number) => {
        setSelectedCourseId(courseId);
        setEditingBatch(batch);
        setBatchModalOpen(true);
    };

    const handleDeleteBatch = (batch: Batch) => {
        setDeletingItem({ 
            type: 'batch', 
            id: batch.id, 
            name: batch.name,
            studentCount: batch.student_count || 0
        });
        setDeleteModalOpen(true);
    };

    const handleBatchSubmit = async (data: BatchFormData) => {
        if (!selectedCourseId) return;
        
        try {
            setIsSavingBatch(true);
            if (editingBatch) {
                await adminApi.updateBatch(editingBatch.id, data);
            } else {
                await adminApi.createBatch({
                    ...data,
                    course: selectedCourseId,
                });
            }
            setBatchModalOpen(false);
            fetchCourses();
        } catch (err: any) {
            console.error('Error saving batch:', err);
        } finally {
            setIsSavingBatch(false);
        }
    };

    // Delete handler
    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        
        try {
            setIsDeleting(true);
            if (deletingItem.type === 'course') {
                await adminApi.deleteCourse(deletingItem.id);
            } else {
                await adminApi.deleteBatch(deletingItem.id);
            }
            setDeleteModalOpen(false);
            setDeletingItem(null);
            fetchCourses();
        } catch (err: any) {
            console.error('Error deleting:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter courses by search
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Courses List */}
            {courses.length > 0 ? (
                <div className="space-y-4">
                    {courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            onEdit={() => handleEditCourse(course)}
                            onDelete={() => handleDeleteCourse(course)}
                            onAddBatch={() => handleAddBatch(course.id)}
                            onEditBatch={(batch) => handleEditBatch(batch, course.id)}
                            onDeleteBatch={handleDeleteBatch}
                            onRefresh={fetchCourses}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-card rounded-2xl border border-default">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-body-subtle" />
                    <h3 className="text-lg font-semibold text-heading mb-2">
                        No courses yet
                    </h3>
                    <p className="text-body-muted mb-4">
                        Create your first course to get started
                    </p>
                </div>
            )}

            {/* Big Add Course Button */}
            <button
                onClick={handleAddCourse}
                className="w-full p-6 bg-card border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl hover:border-secondary hover:bg-secondary-50/50 dark:hover:bg-secondary-900/20 transition-all duration-200 group"
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-secondary-100 dark:bg-secondary-900/40 group-hover:bg-secondary-200 dark:group-hover:bg-secondary-900/60 transition-colors">
                        <Plus className="w-8 h-8 text-secondary" />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-semibold text-heading group-hover:text-secondary transition-colors">
                            Add New Course
                        </p>
                        <p className="text-sm text-body-muted">
                            Create a new course with batches for students
                        </p>
                    </div>
                </div>
            </button>

            {/* Modals */}
            <CourseFormModal
                isOpen={courseModalOpen}
                onClose={() => setCourseModalOpen(false)}
                onSubmit={handleCourseSubmit}
                initialData={editingCourse}
                isSubmitting={isSavingCourse}
            />

            {selectedCourseId && (
                <BatchFormModal
                    isOpen={batchModalOpen}
                    onClose={() => setBatchModalOpen(false)}
                    onSubmit={handleBatchSubmit}
                    initialData={editingBatch}
                    courseId={selectedCourseId}
                    isSubmitting={isSavingBatch}
                />
            )}

            {deletingItem && (() => {
                let modalProps = {
                    title: '',
                    message: '',
                    confirmLabel: 'Delete',
                    cancelLabel: 'Cancel',
                    showConfirm: true
                };

                if (deletingItem.type === 'batch') {
                    if ((deletingItem.studentCount || 0) > 0) {
                        modalProps = {
                            title: 'Cannot Delete Batch',
                            message: `There are ${deletingItem.studentCount} student(s) enrolled in this batch.\n\nYou need to deactivate the students or move them to another batch before deleting.`,
                            confirmLabel: '',
                            cancelLabel: 'Close',
                            showConfirm: false
                        };
                    } else {
                        modalProps = {
                            title: 'Delete Batch',
                            message: `Are you sure you want to delete batch "${deletingItem.name}"? This action cannot be undone.`,
                            confirmLabel: 'Delete Batch',
                            cancelLabel: 'Cancel',
                            showConfirm: true
                        };
                    }
                } else {
                    // Course
                    if ((deletingItem.batchCount || 0) > 0) {
                        modalProps = {
                            title: 'Inactivate Course',
                            message: `This course has ${deletingItem.batchCount} batch(es). The course will be marked as inactive instead of being permanently deleted.`,
                            confirmLabel: 'Inactivate Course',
                            cancelLabel: 'Cancel',
                            showConfirm: true
                        };
                    } else {
                        modalProps = {
                            title: 'Delete Course',
                            message: `Are you sure you want to delete course "${deletingItem.name}"? This action cannot be undone.`,
                            confirmLabel: 'Delete Course',
                            cancelLabel: 'Cancel',
                            showConfirm: true
                        };
                    }
                }

                return (
                    <DeleteModal
                        isOpen={deleteModalOpen}
                        onClose={() => {
                            setDeleteModalOpen(false);
                            setDeletingItem(null);
                        }}
                        onConfirm={handleConfirmDelete}
                        isDeleting={isDeleting}
                        {...modalProps}
                    />
                );
            })()}
        </div>
    );
}
